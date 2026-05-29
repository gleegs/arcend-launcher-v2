import { ipcMain } from 'electron'
import { IpcChannels } from '../types/ipc'
import { login, logout, refresh, getAuthState } from '../services/auth'

export function registerAuthIpc(): void {
  ipcMain.handle(IpcChannels.AUTH_LOGIN, () => login())
  ipcMain.handle(IpcChannels.AUTH_LOGOUT, () => logout())
  ipcMain.handle(IpcChannels.AUTH_REFRESH, () => refresh())
  ipcMain.handle(IpcChannels.AUTH_GET_STATE, () => getAuthState())
}
