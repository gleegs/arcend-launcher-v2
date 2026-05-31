import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { getMainWindow } from './window'
import { IpcChannels } from '../types/ipc'
import { arcsDir, arcRegistryPath } from '../lib/paths'
import { ensurePackwiz, getJarPath } from './packwiz'
import { ensureJava, getJavaExecutable } from './java'
import type { ArcInstallation, ArcRegistry, ArcInstallProgress, ArcMetadata } from '../types/arc'

function getEmptyRegistry(): ArcRegistry {
  return { installations: {} }
}

function sendProgress(progress: ArcInstallProgress): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.ARC_ON_INSTALL_PROGRESS, progress)
  }
}

export function getRegistry(): ArcRegistry {
  if (!fs.existsSync(arcRegistryPath)) {
    return getEmptyRegistry()
  }
  try {
    const raw = fs.readFileSync(arcRegistryPath, 'utf-8')
    return JSON.parse(raw) as ArcRegistry
  } catch {
    return getEmptyRegistry()
  }
}

function saveRegistry(registry: ArcRegistry): void {
  const dir = path.dirname(arcRegistryPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(arcRegistryPath, JSON.stringify(registry, null, 2), 'utf-8')
}

export function getArcPath(arcId: string): string {
  return path.join(arcsDir, arcId)
}

export function isInstalled(arcId: string): boolean {
  const registry = getRegistry()
  const installation = registry.installations[arcId]
  if (!installation) return false
  return fs.existsSync(installation.path)
}

export function getInstalledArcs(): ArcInstallation[] {
  const registry = getRegistry()
  return Object.values(registry.installations).filter((installation) =>
    fs.existsSync(installation.path)
  )
}

function getDirectorySize(dirPath: string): number {
  let totalSize = 0
  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      totalSize += getDirectorySize(filePath)
    } else {
      totalSize += stat.size
    }
  }
  return totalSize
}

function cleanupArcInstall(arcId: string, arcPath: string): void {
  if (fs.existsSync(arcPath)) {
    fs.rmSync(arcPath, { recursive: true, force: true })
  }
  const registry = getRegistry()
  delete registry.installations[arcId]
  saveRegistry(registry)
}

async function runPackwiz(mcPath: string, packwizUrl: string): Promise<void> {
  await ensureJava('21')
  const packwizJar = getJarPath()
  const javaPath = getJavaExecutable('21')

  return new Promise((resolve, reject) => {
    const args = ['-Dfile.encoding=UTF-8', '-jar', packwizJar, '--no-gui', packwizUrl]

    const process = spawn(javaPath, args, { cwd: mcPath })

    let stdout = ''
    let stderr = ''

    process.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    process.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Packwiz failed with code ${code}: ${stderr || stdout}`))
      }
    })

    process.on('error', (err) => {
      reject(new Error(`Failed to spawn packwiz: ${err.message}`))
    })
  })
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          fetchText(res.headers.location).then(resolve).catch(reject)
          return
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} pour ${url}`))
          return
        }
        let data = ''
        res.on('data', (chunk: Buffer) => (data += chunk))
        res.on('end', () => resolve(data))
        res.on('error', reject)
      })
      .on('error', reject)
  })
}

function parsePackToml(content: string): { mcVersion: string } {
  const mcVersionMatch = content.match(/minecraft\s*=\s*"([^"]+)"/)
  if (!mcVersionMatch) {
    throw new Error('Version Minecraft non trouvée dans pack.toml')
  }

  return { mcVersion: mcVersionMatch[1] }
}

async function resolveMetadata(metadata: ArcMetadata): Promise<ArcMetadata> {
  if (metadata.mcVersion) return metadata

  const packToml = await fetchText(metadata.packwizUrl)
  const { mcVersion } = parsePackToml(packToml)

  return { ...metadata, mcVersion }
}

export async function installArc(arcId: string, metadata: ArcMetadata): Promise<ArcInstallation> {
  if (!fs.existsSync(arcsDir)) {
    fs.mkdirSync(arcsDir, { recursive: true })
  }

  const arcPath = getArcPath(arcId)
  const mcPath = path.join(arcPath, 'minecraft')

  try {
    await ensurePackwiz()

    sendProgress({ arcId, percent: 0, status: 'creating_folder' })

    const resolvedMetadata = await resolveMetadata(metadata)

    if (fs.existsSync(arcPath)) {
      fs.rmSync(arcPath, { recursive: true, force: true })
    }
    fs.mkdirSync(mcPath, { recursive: true })

    sendProgress({ arcId, percent: 25, status: 'syncing_packwiz' })

    await runPackwiz(mcPath, resolvedMetadata.packwizUrl)

    sendProgress({ arcId, percent: 75, status: 'creating_metadata' })

    const arcJsonPath = path.join(arcPath, 'arc.json')
    fs.writeFileSync(arcJsonPath, JSON.stringify(resolvedMetadata, null, 2), 'utf-8')

    const size = getDirectorySize(arcPath)

    const installation: ArcInstallation = {
      arcId,
      path: arcPath,
      installedAt: new Date().toISOString(),
      metadata: resolvedMetadata,
      size,
    }

    const registry = getRegistry()
    registry.installations[arcId] = installation
    saveRegistry(registry)

    sendProgress({ arcId, percent: 100, status: 'done' })

    return installation
  } catch (error) {
    cleanupArcInstall(arcId, arcPath)
    sendProgress({
      arcId,
      percent: 0,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export function uninstallArc(arcId: string): void {
  const installation = getRegistry().installations[arcId]
  if (!installation) {
    throw new Error(`Arc ${arcId} is not installed`)
  }

  if (fs.existsSync(installation.path)) {
    fs.rmSync(installation.path, { recursive: true, force: true })
  }

  const registry = getRegistry()
  delete registry.installations[arcId]
  saveRegistry(registry)
}
