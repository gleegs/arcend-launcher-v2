import Store from 'electron-store'
import { app } from 'electron'
import path from 'node:path'
import type { AppConfig } from '../types/ipc'

const configDir = path.join(app.getPath('appData'), '.arcend')

const defaults: AppConfig = {
  windowBounds: {
    width: 1280,
    height: 720,
  },
}

let storeInstance: Store<AppConfig> | null = null

function getStore(): Store<AppConfig> {
  if (!storeInstance) {
    storeInstance = new Store<AppConfig>({
      cwd: configDir,
      defaults,
    })
  }
  return storeInstance
}

export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return getStore().get(key)
}

export function setConfig<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
  getStore().set(key, value)
}

export function initStore(): void {
  getStore()
}
