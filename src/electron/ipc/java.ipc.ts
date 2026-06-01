import { IpcChannels } from '../types/ipc'
import {
  getRegistry,
  ensureJava,
  installJava,
  isInstalled,
  getJavaExecutable,
} from '../services/java'
import { safeHandle } from './utils'

export function registerJavaIpc(): void {
  safeHandle(IpcChannels.JAVA_GET_REGISTRY, () => getRegistry())

  safeHandle(IpcChannels.JAVA_ENSURE, (version: unknown) => ensureJava(version as string))

  safeHandle(IpcChannels.JAVA_INSTALL, (version: unknown) => installJava(version as string))

  safeHandle(IpcChannels.JAVA_IS_INSTALLED, (version: unknown) => isInstalled(version as string))

  safeHandle(IpcChannels.JAVA_GET_EXECUTABLE, (version: unknown) =>
    getJavaExecutable(version as string)
  )
}
