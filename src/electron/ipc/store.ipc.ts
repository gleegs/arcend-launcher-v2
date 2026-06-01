import { IpcChannels } from '../types/ipc'
import type { AppConfig } from '../types/ipc'
import { getConfig, setConfig } from '../services/store'
import { safeHandle } from './utils'

export function registerStoreIpc(): void {
  safeHandle(IpcChannels.STORE_GET, (key: unknown) => getConfig(key as keyof AppConfig))

  safeHandle(IpcChannels.STORE_SET, (key: unknown, value: unknown) =>
    setConfig(key as keyof AppConfig, value as AppConfig[keyof AppConfig])
  )
}
