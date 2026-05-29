import { ipcMain } from 'electron'
import { IpcChannels } from '../types/ipc'
import {
  minimizeWindow,
  maximizeWindow,
  closeWindow,
  hideWindow,
  restoreWindow,
} from '../services/window'

export function registerWindowIpc(): void {
  ipcMain.handle(IpcChannels.WINDOW_MINIMIZE, () => minimizeWindow())
  ipcMain.handle(IpcChannels.WINDOW_MAXIMIZE, () => maximizeWindow())
  ipcMain.handle(IpcChannels.WINDOW_CLOSE, () => closeWindow())
  ipcMain.handle(IpcChannels.WINDOW_HIDE, () => hideWindow())
  ipcMain.handle(IpcChannels.WINDOW_RESTORE, () => restoreWindow())
}
