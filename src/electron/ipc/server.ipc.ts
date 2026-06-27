import { IpcChannels } from '../types/ipc'
import { fetchServerStatus } from '../services/server'
import { safeHandle } from './utils'

export function registerServerIpc(): void {
  safeHandle(IpcChannels.SERVER_FETCH_STATUS, () => fetchServerStatus())
}
