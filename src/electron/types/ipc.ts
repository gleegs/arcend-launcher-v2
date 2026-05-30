import type { JavaInstallation, JavaInstallProgress, JavaRegistry } from './java'
import type { PackwizInstallation, PackwizInstallProgress } from './packwiz'
import type { ArcInstallation, ArcInstallProgress } from './arc'

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
  PACKWIZ_ENSURE: 'packwiz:ensure',
  PACKWIZ_INSTALL: 'packwiz:install',
  PACKWIZ_IS_INSTALLED: 'packwiz:isInstalled',
  PACKWIZ_GET_JAR_PATH: 'packwiz:getJarPath',
  PACKWIZ_ON_INSTALL_PROGRESS: 'packwiz:onInstallProgress',
  ARC_GET_REGISTRY: 'arc:getRegistry',
  ARC_INSTALL: 'arc:install',
  ARC_UNINSTALL: 'arc:uninstall',
  ARC_IS_INSTALLED: 'arc:isInstalled',
  ARC_GET_PATH: 'arc:getPath',
  ARC_ON_INSTALL_PROGRESS: 'arc:onInstallProgress',
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
  packwizEnsure: () => Promise<PackwizInstallation>
  packwizInstall: () => Promise<PackwizInstallation>
  packwizIsInstalled: () => Promise<boolean>
  packwizGetJarPath: () => Promise<string>
  onPackwizInstallProgress: (callback: (progress: PackwizInstallProgress) => void) => () => void
  arcGetRegistry: () => Promise<ArcInstallation[]>
  arcInstall: (arcId: string, metadata: ArcMetadata) => Promise<ArcInstallation>
  arcUninstall: (arcId: string) => Promise<void>
  arcIsInstalled: (arcId: string) => Promise<boolean>
  arcGetPath: (arcId: string) => Promise<string>
  onArcInstallProgress: (callback: (progress: ArcInstallProgress) => void) => () => void
}

export interface ArcMetadata {
  arcId: string
  name: string
  version: string
  packwizUrl: string
  description?: string
  cover?: string
}
