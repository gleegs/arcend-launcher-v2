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
}
