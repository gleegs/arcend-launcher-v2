import { ipcMain } from 'electron'
import { IpcChannels } from '../types/ipc'
import {
  minimizeWindow,
  maximizeWindow,
  closeWindow,
  hideWindow,
  restoreWindow,
  getWindowPosition,
  setWindowPosition,
} from '../services/window'
import { safeHandle } from './utils'

export function registerWindowIpc(): void {
  safeHandle(IpcChannels.WINDOW_MINIMIZE, () => minimizeWindow())
  safeHandle(IpcChannels.WINDOW_MAXIMIZE, () => maximizeWindow())
  safeHandle(IpcChannels.WINDOW_CLOSE, () => closeWindow())
  safeHandle(IpcChannels.WINDOW_HIDE, () => hideWindow())
  safeHandle(IpcChannels.WINDOW_RESTORE, () => restoreWindow())
  safeHandle(IpcChannels.WINDOW_GET_POSITION, () => getWindowPosition())
  // One-way (send) pour le drag : pas de round-trip par frame.
  ipcMain.on(IpcChannels.WINDOW_MOVE, (_event, x: number, y: number) => {
    setWindowPosition(x, y)
  })
}
