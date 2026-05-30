import { ipcMain } from 'electron'
import { IpcChannels } from '../types/ipc'
import {
  getRegistry,
  ensureJava,
  installJava,
  isInstalled,
  getJavaExecutable,
} from '../services/java'

export function registerJavaIpc(): void {
  ipcMain.handle(IpcChannels.JAVA_GET_REGISTRY, () => getRegistry())

  ipcMain.handle(IpcChannels.JAVA_ENSURE, (_event, version: string) => ensureJava(version))

  ipcMain.handle(IpcChannels.JAVA_INSTALL, (_event, version: string) => installJava(version))

  ipcMain.handle(IpcChannels.JAVA_IS_INSTALLED, (_event, version: string) => isInstalled(version))

  ipcMain.handle(IpcChannels.JAVA_GET_EXECUTABLE, (_event, version: string) =>
    getJavaExecutable(version)
  )
}
