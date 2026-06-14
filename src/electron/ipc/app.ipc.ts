import { app } from 'electron'
import { IpcChannels } from '../types/ipc'
import { safeHandle } from './utils'

export function registerAppIpc(): void {
  safeHandle(IpcChannels.APP_GET_VERSION, () => app.getVersion())
}
