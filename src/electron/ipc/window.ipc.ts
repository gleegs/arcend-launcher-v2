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
  safeHandle(IpcChannels.WINDOW_SET_POSITION, (x: unknown, y: unknown) =>
    setWindowPosition(x as number, y as number)
  )
}
