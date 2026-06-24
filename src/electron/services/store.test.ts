import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AppConfig } from '../types/ipc'

const mockStoreInstance = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('electron-store', () => {
  return {
    default: vi.fn(function () {
      return mockStoreInstance
    }),
  }
})

vi.mock('../lib/paths', () => ({
  launcherConfigPath: '/fake/config/path',
}))

describe('store service', () => {
  beforeEach(() => {
    vi.resetModules()
    mockStoreInstance.get.mockReset()
    mockStoreInstance.set.mockReset()
    mockStoreInstance.delete.mockReset()
  })

  describe('getConfig', () => {
    it('returns the value from store.get()', async () => {
      const windowBounds = { width: 1280, height: 720 }
      mockStoreInstance.get.mockReturnValue(windowBounds)

      const { getConfig } = await import('./store')
      const result = getConfig('windowBounds' as keyof AppConfig)

      expect(mockStoreInstance.get).toHaveBeenCalledWith('windowBounds')
      expect(result).toEqual(windowBounds)
    })
  })

  describe('setConfig', () => {
    it('calls store.set() when value is defined', async () => {
      const bounds = { width: 1920, height: 1080 }
      const { setConfig } = await import('./store')
      setConfig('windowBounds' as keyof AppConfig, bounds)

      expect(mockStoreInstance.set).toHaveBeenCalledWith('windowBounds', bounds)
      expect(mockStoreInstance.delete).not.toHaveBeenCalled()
    })

    it('calls store.delete() when value is undefined', async () => {
      const { setConfig } = await import('./store')
      setConfig('encryptedRefreshToken' as keyof AppConfig, undefined)

      expect(mockStoreInstance.delete).toHaveBeenCalledWith('encryptedRefreshToken')
      expect(mockStoreInstance.set).not.toHaveBeenCalled()
    })
  })

  describe('initStore', () => {
    it('creates a Store instance', async () => {
      const Store = (await import('electron-store')).default
      const { initStore } = await import('./store')

      initStore()

      expect(Store).toHaveBeenCalledWith(
        expect.objectContaining({
          cwd: '/fake/config/path',
          defaults: expect.objectContaining({
            arcSettings: {},
          }),
        })
      )
    })

    it('reuses the same instance on subsequent calls', async () => {
      const Store = (await import('electron-store')).default
      const { initStore } = await import('./store')

      vi.mocked(Store).mockClear()
      initStore()
      initStore()

      expect(Store).toHaveBeenCalledTimes(1)
    })
  })
})
