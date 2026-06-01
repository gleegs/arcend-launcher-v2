import { IpcChannels } from '../types/ipc'
import { ensurePackwiz, installPackwiz, isInstalled, getJarPath } from '../services/packwiz'
import { safeHandle } from './utils'

export function registerPackwizIpc(): void {
  safeHandle(IpcChannels.PACKWIZ_ENSURE, () => ensurePackwiz())

  safeHandle(IpcChannels.PACKWIZ_INSTALL, () => installPackwiz())

  safeHandle(IpcChannels.PACKWIZ_IS_INSTALLED, () => isInstalled())

  safeHandle(IpcChannels.PACKWIZ_GET_JAR_PATH, () => getJarPath())
}
