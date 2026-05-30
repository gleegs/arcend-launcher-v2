import fs, { createWriteStream } from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { getMainWindow } from './window'
import { IpcChannels } from '../types/ipc'
import { packwizDir, packwizRegistryPath } from '../lib/paths'
import type { PackwizInstallation, PackwizInstallProgress, PackwizRegistry } from '../types/packwiz'

const PACKWIZ_VERSION = '0.5.14'
const PACKWIZ_JAR_NAME = 'packwiz-installer.jar'
const PACKWIZ_DOWNLOAD_URL = `https://github.com/packwiz/packwiz-installer/releases/download/v${PACKWIZ_VERSION}/packwiz-installer.jar`
const PACKWIZ_JAR_SIZE = 4378828

function getEmptyRegistry(): PackwizRegistry {
  return { installation: null }
}

function sendProgress(progress: PackwizInstallProgress): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.PACKWIZ_ON_INSTALL_PROGRESS, progress)
  }
}

export function getRegistry(): PackwizRegistry {
  if (!fs.existsSync(packwizRegistryPath)) {
    return getEmptyRegistry()
  }
  try {
    const raw = fs.readFileSync(packwizRegistryPath, 'utf-8')
    return JSON.parse(raw) as PackwizRegistry
  } catch {
    return getEmptyRegistry()
  }
}

function saveRegistry(registry: PackwizRegistry): void {
  const dir = path.dirname(packwizRegistryPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(packwizRegistryPath, JSON.stringify(registry, null, 2), 'utf-8')
}

export function getJarPath(): string {
  return path.join(packwizDir, PACKWIZ_JAR_NAME)
}

export function isInstalled(): boolean {
  const registry = getRegistry()
  if (!registry.installation) return false
  return fs.existsSync(registry.installation.jarPath)
}

export async function installPackwiz(): Promise<PackwizInstallation> {
  if (!fs.existsSync(packwizDir)) {
    fs.mkdirSync(packwizDir, { recursive: true })
  }

  const jarPath = getJarPath()

  await downloadJar(PACKWIZ_DOWNLOAD_URL, jarPath, PACKWIZ_JAR_SIZE)

  const installation: PackwizInstallation = {
    version: PACKWIZ_VERSION,
    jarPath,
    installedAt: new Date().toISOString(),
  }

  const registry = getRegistry()
  registry.installation = installation
  saveRegistry(registry)

  sendProgress({ percent: 100, status: 'done' })

  return installation
}

export async function ensurePackwiz(): Promise<PackwizInstallation> {
  const registry = getRegistry()
  if (registry.installation && fs.existsSync(registry.installation.jarPath)) {
    return registry.installation
  }
  return installPackwiz()
}

function downloadJar(url: string, destPath: string, totalSize: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath)
    let downloaded = 0
    let lastPercent = -1

    const doRequest = (requestUrl: string) => {
      https
        .get(requestUrl, (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            doRequest(res.headers.location)
            return
          }

          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Download failed with status ${res.statusCode}`))
            return
          }

          res.on('data', (chunk: Buffer) => {
            downloaded += chunk.length
            const percent = totalSize > 0 ? Math.floor((downloaded / totalSize) * 100) : 0
            if (percent !== lastPercent) {
              lastPercent = percent
              sendProgress({ percent, status: 'downloading' })
            }
          })

          res.pipe(file)

          file.on('finish', () => {
            file.close(() => resolve())
          })
        })
        .on('error', (err) => {
          if (fs.existsSync(destPath)) {
            fs.unlinkSync(destPath)
          }
          reject(err)
        })
    }

    doRequest(url)
  })
}
