import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from './electron/types/ipc'
import type { ElectronApi, AppConfig } from './electron/types/ipc'

const electronApi: ElectronApi = {
  windowMinimize: () => ipcRenderer.invoke(IpcChannels.WINDOW_MINIMIZE),
  windowMaximize: () => ipcRenderer.invoke(IpcChannels.WINDOW_MAXIMIZE),
  windowClose: () => ipcRenderer.invoke(IpcChannels.WINDOW_CLOSE),
  windowHide: () => ipcRenderer.invoke(IpcChannels.WINDOW_HIDE),
  windowRestore: () => ipcRenderer.invoke(IpcChannels.WINDOW_RESTORE),
  storeGet: <K extends keyof AppConfig>(key: K) =>
    ipcRenderer.invoke(IpcChannels.STORE_GET, key) as Promise<AppConfig[K]>,
  storeSet: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) =>
    ipcRenderer.invoke(IpcChannels.STORE_SET, key, value),
}

contextBridge.exposeInMainWorld('electronAPI', electronApi)
