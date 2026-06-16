import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useArcSettingsStore, DEFAULT_MAX_MEMORY } from './arcSettings'

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
  useArcSettingsStore.setState({ settingsByArc: {}, isArcSettingsOpen: false })
  mockStoreGet.mockReset()
  mockStoreSet.mockReset()
})

afterEach(() => {
  globalThis.window = originalWindow
})

describe('useArcSettingsStore', () => {
  describe('setIsArcSettingsOpen', () => {
    it('sets isArcSettingsOpen to true', () => {
      useArcSettingsStore.getState().setIsArcSettingsOpen(true)

      expect(useArcSettingsStore.getState().isArcSettingsOpen).toBe(true)
    })

    it('sets isArcSettingsOpen to false', () => {
      useArcSettingsStore.setState({ isArcSettingsOpen: true })

      useArcSettingsStore.getState().setIsArcSettingsOpen(false)

      expect(useArcSettingsStore.getState().isArcSettingsOpen).toBe(false)
    })
  })

  describe('toggleArcSettings', () => {
    it('toggles from false to true', () => {
      useArcSettingsStore.setState({ isArcSettingsOpen: false })

      useArcSettingsStore.getState().toggleArcSettings()

      expect(useArcSettingsStore.getState().isArcSettingsOpen).toBe(true)
    })

    it('toggles from true to false', () => {
      useArcSettingsStore.setState({ isArcSettingsOpen: true })

      useArcSettingsStore.getState().toggleArcSettings()

      expect(useArcSettingsStore.getState().isArcSettingsOpen).toBe(false)
    })
  })

  describe('initArcSettings', () => {
    it('loads arcSettings from electron-store when ok and data present', async () => {
      const data = { 'arc-1': { maxMemory: 12 } }
      mockStoreGet.mockResolvedValue({ ok: true, data })

      await useArcSettingsStore.getState().initArcSettings()

      expect(mockStoreGet).toHaveBeenCalledWith('arcSettings')
      expect(useArcSettingsStore.getState().settingsByArc).toEqual(data)
    })

    it('keeps empty map when result is not ok', async () => {
      mockStoreGet.mockResolvedValue({ ok: false, error: 'fail' })

      await useArcSettingsStore.getState().initArcSettings()

      expect(useArcSettingsStore.getState().settingsByArc).toEqual({})
    })

    it('keeps empty map when data is undefined', async () => {
      mockStoreGet.mockResolvedValue({ ok: true, data: undefined })

      await useArcSettingsStore.getState().initArcSettings()

      expect(useArcSettingsStore.getState().settingsByArc).toEqual({})
    })
  })

  describe('getArcSettings', () => {
    it('returns stored settings for a known arc', () => {
      useArcSettingsStore.setState({ settingsByArc: { 'arc-1': { maxMemory: 10 } } })

      const result = useArcSettingsStore.getState().getArcSettings('arc-1')

      expect(result).toEqual({ maxMemory: 10 })
    })

    it(`returns default maxMemory (${DEFAULT_MAX_MEMORY}) for an unknown arc`, () => {
      const result = useArcSettingsStore.getState().getArcSettings('unknown-arc')

      expect(result).toEqual({ maxMemory: DEFAULT_MAX_MEMORY })
    })
  })

  describe('setArcMemory', () => {
    it('updates state and persists via IPC', async () => {
      mockStoreSet.mockResolvedValue({ ok: true })

      await useArcSettingsStore.getState().setArcMemory('arc-1', 12)

      expect(useArcSettingsStore.getState().settingsByArc['arc-1']).toEqual({ maxMemory: 12 })
      expect(mockStoreSet).toHaveBeenCalledWith('arcSettings', { 'arc-1': { maxMemory: 12 } })
    })

    it('preserves other arc settings when updating one', async () => {
      useArcSettingsStore.setState({ settingsByArc: { 'arc-1': { maxMemory: 8 } } })
      mockStoreSet.mockResolvedValue({ ok: true })

      await useArcSettingsStore.getState().setArcMemory('arc-2', 16)

      expect(useArcSettingsStore.getState().settingsByArc).toEqual({
        'arc-1': { maxMemory: 8 },
        'arc-2': { maxMemory: 16 },
      })
    })
  })
})
