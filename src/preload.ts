import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from './electron/types/ipc'
import type { ElectronApi, AppConfig, AuthState } from './electron/types/ipc'

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
  authLogin: () => ipcRenderer.invoke(IpcChannels.AUTH_LOGIN) as Promise<AuthState>,
  authLogout: () => ipcRenderer.invoke(IpcChannels.AUTH_LOGOUT),
  authRefresh: () => ipcRenderer.invoke(IpcChannels.AUTH_REFRESH) as Promise<AuthState>,
  authGetState: () => ipcRenderer.invoke(IpcChannels.AUTH_GET_STATE) as Promise<AuthState>,
}

contextBridge.exposeInMainWorld('electronAPI', electronApi)
