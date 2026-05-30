import { ipcMain } from 'electron'
import { IpcChannels } from '../types/ipc'
import { ensurePackwiz, installPackwiz, isInstalled, getJarPath } from '../services/packwiz'

export function registerPackwizIpc(): void {
  ipcMain.handle(IpcChannels.PACKWIZ_ENSURE, () => ensurePackwiz())

  ipcMain.handle(IpcChannels.PACKWIZ_INSTALL, () => installPackwiz())

  ipcMain.handle(IpcChannels.PACKWIZ_IS_INSTALLED, () => isInstalled())

  ipcMain.handle(IpcChannels.PACKWIZ_GET_JAR_PATH, () => getJarPath())
}
