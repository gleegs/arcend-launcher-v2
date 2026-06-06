import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

const mockGetConfig = vi.fn()
const mockSetConfig = vi.fn()

vi.mock('../services/store', () => ({
  getConfig: (...args: unknown[]) => mockGetConfig(...args),
  setConfig: (...args: unknown[]) => mockSetConfig(...args),
}))

vi.mock('../lib/paths', () => ({
  launcherConfigPath: '/fake/config/path',
}))

describe('registerStoreIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockGetConfig.mockReset()
    mockSetConfig.mockReset()
    vi.resetModules()
    const { registerStoreIpc } = await import('./store.ipc')
    registerStoreIpc()
  })

  it('registers exactly 2 channels: store:get and store:set', () => {
    expect(handlers['store:get']).toBeDefined()
    expect(handlers['store:set']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(2)
  })

  it('store:get handler calls getConfig with the key', async () => {
    mockGetConfig.mockReturnValue({ width: 1280, height: 720 })

    const result = await handlers['store:get']({}, 'windowBounds')

    expect(mockGetConfig).toHaveBeenCalledWith('windowBounds')
    expect(result).toEqual({ ok: true, data: { width: 1280, height: 720 } })
  })

  it('store:set handler calls setConfig with key and value', async () => {
    const bounds = { width: 1920, height: 1080 }

    const result = await handlers['store:set']({}, 'windowBounds', bounds)

    expect(mockSetConfig).toHaveBeenCalledWith('windowBounds', bounds)
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('returns { ok: false, error } when handler throws', async () => {
    mockGetConfig.mockImplementation(() => {
      throw new Error('store read failed')
    })

    const result = await handlers['store:get']({}, 'windowBounds')

    expect(result).toEqual({ ok: false, error: 'store read failed' })
  })

  it('returns { ok: false, error } with stringified non-Error', async () => {
    mockSetConfig.mockImplementation(() => {
      throw 'unexpected'
    })

    const result = await handlers['store:set']({}, 'windowBounds', {})

    expect(result).toEqual({ ok: false, error: 'unexpected' })
  })
})
