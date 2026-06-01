import { IpcChannels } from '../types/ipc'
import { login, logout, refresh, getAuthState } from '../services/auth'
import { safeHandle } from './utils'

export function registerAuthIpc(): void {
  safeHandle(IpcChannels.AUTH_LOGIN, () => login())
  safeHandle(IpcChannels.AUTH_LOGOUT, () => logout())
  safeHandle(IpcChannels.AUTH_REFRESH, () => refresh())
  safeHandle(IpcChannels.AUTH_GET_STATE, () => getAuthState())
}
