export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
}

export interface AppConfig {
  windowBounds: WindowBounds
}

export const IpcChannels = {
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_HIDE: 'window:hide',
  WINDOW_RESTORE: 'window:restore',
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',
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
}
