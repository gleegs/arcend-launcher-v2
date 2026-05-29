import { ipcMain } from 'electron'
import { IpcChannels } from '../types/ipc'
import type { AppConfig } from '../types/ipc'
import { getConfig, setConfig } from '../services/store'

export function registerStoreIpc(): void {
  ipcMain.handle(IpcChannels.STORE_GET, (_event, key: keyof AppConfig) => getConfig(key))

  ipcMain.handle(
    IpcChannels.STORE_SET,
    (_event, key: keyof AppConfig, value: AppConfig[typeof key]) => setConfig(key, value)
  )
}
