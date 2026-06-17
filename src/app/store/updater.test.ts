import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useUpdaterStore } from './updater'

const mockOnUpdateDownloaded = vi.fn()
const mockUpdaterInstall = vi.fn()

const originalWindow = globalThis.window

beforeEach(() => {
  vi.resetModules()
  globalThis.window = {
    electronAPI: {
      onUpdateDownloaded: (...args: unknown[]) => mockOnUpdateDownloaded(...args),
      updaterInstall: (...args: unknown[]) => mockUpdaterInstall(...args),
    },
  } as unknown as Window & typeof globalThis
  useUpdaterStore.setState({ updateReady: false, version: null })
  mockOnUpdateDownloaded.mockReset()
  mockUpdaterInstall.mockReset()
})

afterEach(() => {
  globalThis.window = originalWindow
})

describe('useUpdaterStore', () => {
  describe('initUpdater', () => {
    it('subscribes to update-downloaded events', () => {
      mockOnUpdateDownloaded.mockReturnValue(() => undefined)

      useUpdaterStore.getState().initUpdater()

      expect(mockOnUpdateDownloaded).toHaveBeenCalledOnce()
      expect(typeof mockOnUpdateDownloaded.mock.calls[0][0]).toBe('function')
    })
  })

  describe('setUpdateDownloaded', () => {
    it('sets updateReady and version', () => {
      useUpdaterStore.getState().setUpdateDownloaded({ version: '2.0.0-beta.2' })

      expect(useUpdaterStore.getState().updateReady).toBe(true)
      expect(useUpdaterStore.getState().version).toBe('2.0.0-beta.2')
    })
  })

  describe('installUpdate', () => {
    it('calls the IPC updaterInstall method', async () => {
      mockUpdaterInstall.mockResolvedValue({ ok: true })

      await useUpdaterStore.getState().installUpdate()

      expect(mockUpdaterInstall).toHaveBeenCalledOnce()
    })
  })

  describe('onUpdateDownloaded callback wiring', () => {
    it('the registered callback updates the store when fired', () => {
      let registeredCallback: (info: { version: string }) => void = () => undefined
      mockOnUpdateDownloaded.mockImplementation((cb: (info: { version: string }) => void) => {
        registeredCallback = cb
        return () => undefined
      })

      useUpdaterStore.getState().initUpdater()
      registeredCallback({ version: '2.0.0-beta.2' })

      expect(useUpdaterStore.getState().updateReady).toBe(true)
      expect(useUpdaterStore.getState().version).toBe('2.0.0-beta.2')
    })
  })
})
