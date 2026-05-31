import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannels } from './electron/types/ipc'
import type { ElectronApi, AppConfig, AuthState, ArcMetadata } from './electron/types/ipc'
import type { JavaInstallProgress } from './electron/types/java'
import type { PackwizInstallProgress } from './electron/types/packwiz'
import type { ArcInstallProgress } from './electron/types/arc'
import type { LaunchOptions, LaunchProgress } from './electron/types/launcher'

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
  javaGetRegistry: () => ipcRenderer.invoke(IpcChannels.JAVA_GET_REGISTRY),
  javaEnsure: (version: string) => ipcRenderer.invoke(IpcChannels.JAVA_ENSURE, version),
  javaInstall: (version: string) => ipcRenderer.invoke(IpcChannels.JAVA_INSTALL, version),
  javaIsInstalled: (version: string) => ipcRenderer.invoke(IpcChannels.JAVA_IS_INSTALLED, version),
  javaGetExecutable: (version: string) =>
    ipcRenderer.invoke(IpcChannels.JAVA_GET_EXECUTABLE, version),
  onJavaInstallProgress: (callback: (progress: JavaInstallProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: JavaInstallProgress) =>
      callback(progress)
    ipcRenderer.on(IpcChannels.JAVA_ON_INSTALL_PROGRESS, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.JAVA_ON_INSTALL_PROGRESS, handler)
    }
  },
  packwizEnsure: () => ipcRenderer.invoke(IpcChannels.PACKWIZ_ENSURE),
  packwizInstall: () => ipcRenderer.invoke(IpcChannels.PACKWIZ_INSTALL),
  packwizIsInstalled: () => ipcRenderer.invoke(IpcChannels.PACKWIZ_IS_INSTALLED),
  packwizGetJarPath: () => ipcRenderer.invoke(IpcChannels.PACKWIZ_GET_JAR_PATH),
  onPackwizInstallProgress: (callback: (progress: PackwizInstallProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: PackwizInstallProgress) =>
      callback(progress)
    ipcRenderer.on(IpcChannels.PACKWIZ_ON_INSTALL_PROGRESS, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.PACKWIZ_ON_INSTALL_PROGRESS, handler)
    }
  },
  arcGetRegistry: () => ipcRenderer.invoke(IpcChannels.ARC_GET_REGISTRY),
  arcInstall: (arcId: string, metadata: ArcMetadata) =>
    ipcRenderer.invoke(IpcChannels.ARC_INSTALL, arcId, metadata),
  arcUninstall: (arcId: string) => ipcRenderer.invoke(IpcChannels.ARC_UNINSTALL, arcId),
  arcIsInstalled: (arcId: string) => ipcRenderer.invoke(IpcChannels.ARC_IS_INSTALLED, arcId),
  arcGetPath: (arcId: string) => ipcRenderer.invoke(IpcChannels.ARC_GET_PATH, arcId),
  onArcInstallProgress: (callback: (progress: ArcInstallProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ArcInstallProgress) =>
      callback(progress)
    ipcRenderer.on(IpcChannels.ARC_ON_INSTALL_PROGRESS, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.ARC_ON_INSTALL_PROGRESS, handler)
    }
  },
  launchGame: (options: LaunchOptions) => ipcRenderer.invoke(IpcChannels.LAUNCH_GAME, options),
  launchIsRunning: () => ipcRenderer.invoke(IpcChannels.LAUNCH_IS_RUNNING) as Promise<boolean>,
  onLaunchProgress: (callback: (progress: LaunchProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: LaunchProgress) =>
      callback(progress)
    ipcRenderer.on(IpcChannels.LAUNCH_ON_PROGRESS, handler)
    return () => {
      ipcRenderer.removeListener(IpcChannels.LAUNCH_ON_PROGRESS, handler)
    }
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronApi)
