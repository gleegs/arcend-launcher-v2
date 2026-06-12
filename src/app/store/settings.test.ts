import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSettingsStore } from './settings'

const mockStoreGet = vi.fn()
const mockStoreSet = vi.fn()

const originalWindow = globalThis.window

beforeEach(() => {
  vi.resetModules()
  globalThis.window = {
    electronAPI: {
      storeGet: (...args: unknown[]) => mockStoreGet(...args),
      storeSet: (...args: unknown[]) => mockStoreSet(...args),
    },
  } as unknown as Window & typeof globalThis
  useSettingsStore.setState({ isSettingsOpen: false, showConsole: false })
  mockStoreGet.mockReset()
  mockStoreSet.mockReset()
})

afterEach(() => {
  globalThis.window = originalWindow
})

describe('useSettingsStore', () => {
  describe('setIsSettingsOpen', () => {
    it('sets isSettingsOpen to true', () => {
      useSettingsStore.getState().setIsSettingsOpen(true)

      expect(useSettingsStore.getState().isSettingsOpen).toBe(true)
    })

    it('sets isSettingsOpen to false', () => {
      useSettingsStore.setState({ isSettingsOpen: true })

      useSettingsStore.getState().setIsSettingsOpen(false)

      expect(useSettingsStore.getState().isSettingsOpen).toBe(false)
    })
  })

  describe('toggleSettings', () => {
    it('toggles isSettingsOpen from false to true', () => {
      useSettingsStore.setState({ isSettingsOpen: false })

      useSettingsStore.getState().toggleSettings()

      expect(useSettingsStore.getState().isSettingsOpen).toBe(true)
    })

    it('toggles isSettingsOpen from true to false', () => {
      useSettingsStore.setState({ isSettingsOpen: true })

      useSettingsStore.getState().toggleSettings()

      expect(useSettingsStore.getState().isSettingsOpen).toBe(false)
    })
  })

  describe('initShowConsole', () => {
    it('loads showConsole from electron-store when ok and data is defined', async () => {
      mockStoreGet.mockResolvedValue({ ok: true, data: true })

      await useSettingsStore.getState().initShowConsole()

      expect(mockStoreGet).toHaveBeenCalledWith('showConsole')
      expect(useSettingsStore.getState().showConsole).toBe(true)
    })

    it('keeps default false when result is not ok', async () => {
      mockStoreGet.mockResolvedValue({ ok: false, error: 'fail' })

      await useSettingsStore.getState().initShowConsole()

      expect(useSettingsStore.getState().showConsole).toBe(false)
    })

    it('keeps default false when data is undefined', async () => {
      mockStoreGet.mockResolvedValue({ ok: true, data: undefined })

      await useSettingsStore.getState().initShowConsole()

      expect(useSettingsStore.getState().showConsole).toBe(false)
    })
  })

  describe('setShowConsole', () => {
    it('updates state and persists via IPC', async () => {
      mockStoreSet.mockResolvedValue({ ok: true })

      await useSettingsStore.getState().setShowConsole(true)

      expect(useSettingsStore.getState().showConsole).toBe(true)
      expect(mockStoreSet).toHaveBeenCalledWith('showConsole', true)
    })

    it('persists false value', async () => {
      useSettingsStore.setState({ showConsole: true })
      mockStoreSet.mockResolvedValue({ ok: true })

      await useSettingsStore.getState().setShowConsole(false)

      expect(useSettingsStore.getState().showConsole).toBe(false)
      expect(mockStoreSet).toHaveBeenCalledWith('showConsole', false)
    })
  })
})
