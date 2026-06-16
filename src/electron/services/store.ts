import Store from 'electron-store'
import type { AppConfig } from '../types/ipc'
import { launcherConfigPath } from '../lib/paths'

const defaults: AppConfig = {
  windowBounds: {
    width: 1280,
    height: 720,
  },
  encryptedRefreshToken: undefined,
  cachedProfile: undefined,
  showConsole: false,
  arcSettings: {},
}

let storeInstance: Store<AppConfig> | null = null

function getStore(): Store<AppConfig> {
  if (!storeInstance) {
    storeInstance = new Store<AppConfig>({
      cwd: launcherConfigPath,
      defaults,
    })
  }
  return storeInstance
}

export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return getStore().get(key)
}

export function setConfig<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
  if (value === undefined) {
    getStore().delete(key)
  } else {
    getStore().set(key, value)
  }
}

export function initStore(): void {
  getStore()
}
