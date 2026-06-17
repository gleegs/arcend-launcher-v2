import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'node:events'

const mockGetMainWindow = vi.fn()

vi.mock('./window', () => ({
  getMainWindow: (...args: unknown[]) => mockGetMainWindow(...args),
}))

const autoUpdaterEmitter = new EventEmitter()
const mockQuitAndInstall = vi.fn()
const mockUpdateElectronApp = vi.fn()

vi.mock('electron', () => ({
  app: { isPackaged: true },
  autoUpdater: {
    on: autoUpdaterEmitter.on.bind(autoUpdaterEmitter),
    setFeedURL: vi.fn(),
    checkForUpdates: vi.fn(),
    quitAndInstall: (...args: unknown[]) => mockQuitAndInstall(...args),
  },
}))

vi.mock('update-electron-app', () => ({
  updateElectronApp: (...args: unknown[]) => mockUpdateElectronApp(...args),
}))

function setupWindow() {
  const send = vi.fn()
  mockGetMainWindow.mockReturnValue({
    isDestroyed: () => false,
    webContents: { send },
  })
  return send
}

describe('updater service', () => {
  beforeEach(async () => {
    vi.resetModules()
    mockGetMainWindow.mockReset()
    mockQuitAndInstall.mockReset()
    mockUpdateElectronApp.mockReset()
    autoUpdaterEmitter.removeAllListeners()
    mockGetMainWindow.mockReturnValue(null)
    const service = await import('./updater')
    void service
  })

  describe('initUpdater', () => {
    it('calls updateElectronApp with repo and notifyUser disabled', async () => {
      const { initUpdater } = await import('./updater')
      initUpdater()

      expect(mockUpdateElectronApp).toHaveBeenCalledOnce()
      const opts = mockUpdateElectronApp.mock.calls[0][0]
      expect(opts.repo).toBe('gleegs/arcend-launcher-v2')
      expect(opts.notifyUser).toBe(false)
    })

    it('is idempotent (only initializes once)', async () => {
      const { initUpdater } = await import('./updater')
      initUpdater()
      initUpdater()

      expect(mockUpdateElectronApp).toHaveBeenCalledOnce()
    })
  })

  describe('update-downloaded event', () => {
    it('sends the version to the renderer via IPC', async () => {
      const send = setupWindow()
      const { initUpdater } = await import('./updater')
      initUpdater()

      autoUpdaterEmitter.emit(
        'update-downloaded',
        {},
        'release notes',
        '2.0.0-beta.2',
        new Date(),
        'https://example.com/update'
      )

      expect(send).toHaveBeenCalledWith('updater:onUpdateDownloaded', {
        version: '2.0.0-beta.2',
      })
    })

    it('does not send when the window is destroyed', async () => {
      const send = vi.fn()
      mockGetMainWindow.mockReturnValue({
        isDestroyed: () => true,
        webContents: { send },
      })
      const { initUpdater } = await import('./updater')
      initUpdater()

      autoUpdaterEmitter.emit('update-downloaded', {}, 'notes', '2.0.0-beta.2', new Date(), 'url')

      expect(send).not.toHaveBeenCalled()
    })

    it('does not send when there is no window', async () => {
      mockGetMainWindow.mockReturnValue(null)
      const { initUpdater } = await import('./updater')
      initUpdater()

      expect(() => {
        autoUpdaterEmitter.emit('update-downloaded', {}, 'notes', '2.0.0-beta.2', new Date(), 'url')
      }).not.toThrow()
    })
  })

  describe('getUpdateStatus', () => {
    it('returns not ready before any update is downloaded', async () => {
      const { getUpdateStatus } = await import('./updater')
      expect(getUpdateStatus()).toEqual({ updateReady: false, version: null })
    })

    it('returns ready with version after an update is downloaded', async () => {
      const { initUpdater, getUpdateStatus } = await import('./updater')
      initUpdater()

      autoUpdaterEmitter.emit('update-downloaded', {}, 'notes', '2.0.0-beta.2', new Date(), 'url')

      expect(getUpdateStatus()).toEqual({
        updateReady: true,
        version: '2.0.0-beta.2',
      })
    })
  })

  describe('installUpdate', () => {
    it('calls autoUpdater.quitAndInstall', async () => {
      const { installUpdate } = await import('./updater')
      installUpdate()

      expect(mockQuitAndInstall).toHaveBeenCalledOnce()
    })
  })
})
