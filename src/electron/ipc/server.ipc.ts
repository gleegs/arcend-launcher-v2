import { IpcChannels } from '../types/ipc'
import { safeHandle } from './utils'
import { getServerStatus } from '../services/server'

export function registerServerIpc(): void {
  safeHandle(IpcChannels.SERVER_GET_STATUS, () => getServerStatus())
}
