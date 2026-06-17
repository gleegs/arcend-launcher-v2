import { autoUpdater } from 'electron'
import { updateElectronApp } from 'update-electron-app'
import { getMainWindow } from './window'
import { IpcChannels } from '../types/ipc'
import type { UpdateStatus } from '../types/updater'

const REPO = 'gleegs/arcend-launcher-v2'

let updateVersion: string | null = null
let initialized = false

function notifyUpdateDownloaded(version: string): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.UPDATER_ON_UPDATE_DOWNLOADED, { version })
  }
}

export function initUpdater(): void {
  if (initialized) return
  initialized = true

  autoUpdater.on('update-downloaded', (_event, _releaseNotes, releaseName: string) => {
    updateVersion = releaseName
    notifyUpdateDownloaded(releaseName)
  })

  autoUpdater.on('error', (err: unknown) => {
    console.error('[updater] error:', err)
  })

  updateElectronApp({
    repo: REPO,
    updateInterval: '1 hour',
    notifyUser: false,
  })
}

export function getUpdateStatus(): UpdateStatus {
  return { updateReady: updateVersion !== null, version: updateVersion }
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall()
}
