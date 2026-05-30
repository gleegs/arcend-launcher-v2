import fs from 'node:fs'
import path from 'node:path'
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

async function runPackwiz(arcPath: string, packwizUrl: string): Promise<void> {
  await ensureJava('21')
  const packwizJar = getJarPath()
  const javaPath = getJavaExecutable('21')

  return new Promise((resolve, reject) => {
    const args = ['-jar', packwizJar, packwizUrl, arcPath]
    const process = spawn(javaPath, args)

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

export async function installArc(arcId: string, metadata: ArcMetadata): Promise<ArcInstallation> {
  if (!fs.existsSync(arcsDir)) {
    fs.mkdirSync(arcsDir, { recursive: true })
  }

  const arcPath = getArcPath(arcId)

  try {
    await ensurePackwiz()

    sendProgress({ arcId, percent: 0, status: 'creating_folder' })

    if (fs.existsSync(arcPath)) {
      fs.rmSync(arcPath, { recursive: true, force: true })
    }
    fs.mkdirSync(arcPath, { recursive: true })

    sendProgress({ arcId, percent: 25, status: 'syncing_packwiz' })

    await runPackwiz(arcPath, metadata.packwizUrl)

    sendProgress({ arcId, percent: 75, status: 'creating_metadata' })

    const arcJsonPath = path.join(arcPath, 'arc.json')
    fs.writeFileSync(arcJsonPath, JSON.stringify(metadata, null, 2), 'utf-8')

    const size = getDirectorySize(arcPath)

    const installation: ArcInstallation = {
      arcId,
      path: arcPath,
      installedAt: new Date().toISOString(),
      metadata,
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
