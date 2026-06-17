import { IpcChannels } from '../types/ipc'
import { getUpdateStatus, installUpdate } from '../services/updater'
import { safeHandle } from './utils'

export function registerUpdaterIpc(): void {
  safeHandle(IpcChannels.UPDATER_GET_STATUS, () => getUpdateStatus())

  safeHandle(IpcChannels.UPDATER_INSTALL, () => installUpdate())
}
