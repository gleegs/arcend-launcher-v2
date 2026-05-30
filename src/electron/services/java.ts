import fs, { createWriteStream } from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import AdmZip from 'adm-zip'
import { getMainWindow } from './window'
import { IpcChannels } from '../types/ipc'
import { runtimeDir, javaRegistryPath } from '../lib/paths'
import type { JavaInstallation, JavaInstallProgress, JavaRegistry } from '../types/java'

function getEmptyRegistry(): JavaRegistry {
  return { installations: {} }
}

function sendProgress(progress: JavaInstallProgress): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.JAVA_ON_INSTALL_PROGRESS, progress)
  }
}

export function getRegistry(): JavaRegistry {
  if (!fs.existsSync(javaRegistryPath)) {
    return getEmptyRegistry()
  }
  try {
    const raw = fs.readFileSync(javaRegistryPath, 'utf-8')
    return JSON.parse(raw) as JavaRegistry
  } catch {
    return getEmptyRegistry()
  }
}

function saveRegistry(registry: JavaRegistry): void {
  const dir = path.dirname(javaRegistryPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(javaRegistryPath, JSON.stringify(registry, null, 2), 'utf-8')
}

export function isInstalled(version: string): boolean {
  validateVersion(version)
  const registry = getRegistry()
  const entry = registry.installations[version]
  if (!entry) return false
  return fs.existsSync(entry.path)
}

function validateVersion(version: string): void {
  if (!version || typeof version !== 'string') {
    throw new Error('Java version is required')
  }
}

export function getJavaPath(version: string): string {
  validateVersion(version)
  return path.join(runtimeDir, `java-${version}`)
}

export function getJavaExecutable(version: string): string {
  validateVersion(version)
  if (!isInstalled(version)) {
    throw new Error(`Java ${version} is not installed`)
  }
  const registry = getRegistry()
  const entry = registry.installations[version]
  const exe = process.platform === 'win32' ? 'java.exe' : 'java'
  const executablePath = path.join(entry.path, 'bin', exe)
  if (fs.existsSync(executablePath)) return executablePath
  throw new Error(`Java executable not found at ${executablePath}`)
}

interface AdoptiumAsset {
  binary: {
    package: {
      link: string
      name: string
      size: number
    }
  }
}

async function fetchJreDownloadUrl(version: string): Promise<{ url: string; size: number }> {
  const arch = process.arch === 'x64' ? 'x64' : 'x64'
  const platform =
    process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux'
  const imageType = 'jre'

  const apiUrl = `https://api.adoptium.net/v3/assets/latest/${version}/hotspot?architecture=${arch}&image_type=${imageType}&os=${platform}&vendor=eclipse`

  return new Promise((resolve, reject) => {
    https
      .get(apiUrl, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const redirectUrl = res.headers.location
          https.get(redirectUrl, (redirectRes) => {
            let data = ''
            redirectRes.on('data', (chunk) => (data += chunk))
            redirectRes.on('end', () => {
              try {
                const assets = JSON.parse(data) as AdoptiumAsset[]
                const asset = assets[0]
                if (!asset?.binary?.package?.link) {
                  return reject(new Error(`No JRE package found for Java ${version}`))
                }
                resolve({
                  url: asset.binary.package.link,
                  size: asset.binary.package.size,
                })
              } catch {
                reject(new Error(`Failed to parse Adoptium API response for Java ${version}`))
              }
            })
            redirectRes.on('error', reject)
          })
          return
        }

        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            const assets = JSON.parse(data) as AdoptiumAsset[]
            const asset = assets[0]
            if (!asset?.binary?.package?.link) {
              return reject(new Error(`No JRE package found for Java ${version}`))
            }
            resolve({
              url: asset.binary.package.link,
              size: asset.binary.package.size,
            })
          } catch {
            reject(new Error(`Failed to parse Adoptium API response for Java ${version}`))
          }
        })
        res.on('error', reject)
      })
      .on('error', reject)
  })
}

function downloadFile(
  url: string,
  destPath: string,
  totalSize: number,
  version: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

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
              sendProgress({ version, percent, status: 'downloading' })
            }
          })

          res.pipe(file)

          file.on('finish', () => {
            file.close(() => resolve())
          })
        })
        .on('error', (err) => {
          fs.unlinkSync(destPath)
          reject(err)
        })
    }

    doRequest(url)
  })
}

async function extractJre(zipPath: string, version: string): Promise<string> {
  const installPath = getJavaPath(version)
  sendProgress({ version, percent: 0, status: 'extracting' })

  if (fs.existsSync(installPath)) {
    fs.rmSync(installPath, { recursive: true, force: true })
  }

  const zip = new AdmZip(zipPath)
  const entries = zip.getEntries()

  const totalEntries = entries.length
  let extracted = 0

  for (const entry of entries) {
    zip.extractEntryTo(entry, installPath, true, true)
    extracted++
    const percent = Math.floor((extracted / totalEntries) * 100)
    sendProgress({ version, percent, status: 'extracting' })
  }

  const extractedDirs = fs.readdirSync(installPath)
  if (extractedDirs.length === 1) {
    const innerDir = path.join(installPath, extractedDirs[0])
    const stat = fs.statSync(innerDir)
    if (stat.isDirectory()) {
      const innerContents = fs.readdirSync(innerDir)
      for (const item of innerContents) {
        fs.renameSync(path.join(innerDir, item), path.join(installPath, item))
      }
      fs.rmdirSync(innerDir)
    }
  }

  fs.unlinkSync(zipPath)

  return installPath
}

export async function installJava(version: string): Promise<JavaInstallation> {
  validateVersion(version)
  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true })
  }

  const { url, size } = await fetchJreDownloadUrl(version)

  const tempZip = path.join(runtimeDir, `java-${version}-temp.zip`)
  await downloadFile(url, tempZip, size, version)

  const installPath = await extractJre(tempZip, version)

  const installation: JavaInstallation = {
    version,
    path: installPath,
    installedAt: new Date().toISOString(),
    arch: process.arch,
  }

  const registry = getRegistry()
  registry.installations[version] = installation
  saveRegistry(registry)

  sendProgress({ version, percent: 100, status: 'done' })

  return installation
}

export async function ensureJava(version: string): Promise<JavaInstallation> {
  validateVersion(version)
  const registry = getRegistry()
  const existing = registry.installations[version]

  if (existing && fs.existsSync(existing.path)) {
    return existing
  }

  return installJava(version)
}
