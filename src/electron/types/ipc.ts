import type { JavaInstallation, JavaInstallProgress, JavaRegistry } from './java'

export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
}

export interface CachedProfile {
  id: string
  name: string
}

export type AuthState =
  | { status: 'online'; profile: CachedProfile }
  | { status: 'offline'; profile: CachedProfile }
  | { status: 'unauthenticated' }

export interface AppConfig {
  windowBounds: WindowBounds
  encryptedRefreshToken?: string
  cachedProfile?: CachedProfile
}

export const IpcChannels = {
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_HIDE: 'window:hide',
  WINDOW_RESTORE: 'window:restore',
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_REFRESH: 'auth:refresh',
  AUTH_GET_STATE: 'auth:getState',
  JAVA_GET_REGISTRY: 'java:getRegistry',
  JAVA_ENSURE: 'java:ensure',
  JAVA_INSTALL: 'java:install',
  JAVA_IS_INSTALLED: 'java:isInstalled',
  JAVA_GET_EXECUTABLE: 'java:getExecutable',
  JAVA_ON_INSTALL_PROGRESS: 'java:onInstallProgress',
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

export interface ElectronApi {
  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>
  windowHide: () => Promise<void>
  windowRestore: () => Promise<void>
  storeGet: <K extends keyof AppConfig>(key: K) => Promise<AppConfig[K]>
  storeSet: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>
  authLogin: () => Promise<AuthState>
  authLogout: () => Promise<void>
  authRefresh: () => Promise<AuthState>
  authGetState: () => Promise<AuthState>
  javaGetRegistry: () => Promise<JavaRegistry>
  javaEnsure: (version: string) => Promise<JavaInstallation>
  javaInstall: (version: string) => Promise<JavaInstallation>
  javaIsInstalled: (version: string) => Promise<boolean>
  javaGetExecutable: (version: string) => Promise<string>
  onJavaInstallProgress: (callback: (progress: JavaInstallProgress) => void) => () => void
}
