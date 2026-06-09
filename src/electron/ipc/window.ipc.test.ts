import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

const mockMinimizeWindow = vi.fn()
const mockMaximizeWindow = vi.fn()
const mockCloseWindow = vi.fn()
const mockHideWindow = vi.fn()
const mockRestoreWindow = vi.fn()

vi.mock('../services/window', () => ({
  minimizeWindow: (...args: unknown[]) => mockMinimizeWindow(...args),
  maximizeWindow: (...args: unknown[]) => mockMaximizeWindow(...args),
  closeWindow: (...args: unknown[]) => mockCloseWindow(...args),
  hideWindow: (...args: unknown[]) => mockHideWindow(...args),
  restoreWindow: (...args: unknown[]) => mockRestoreWindow(...args),
}))

vi.mock('../services/store', () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn(),
}))

vi.mock('../lib/paths', () => ({
  launcherConfigPath: '/fake/config/path',
}))

describe('registerWindowIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockMinimizeWindow.mockReset()
    mockMaximizeWindow.mockReset()
    mockCloseWindow.mockReset()
    mockHideWindow.mockReset()
    mockRestoreWindow.mockReset()
    vi.resetModules()
    const { registerWindowIpc } = await import('./window.ipc')
    registerWindowIpc()
  })

  it('registers exactly 5 window channels', () => {
    expect(handlers['window:minimize']).toBeDefined()
    expect(handlers['window:maximize']).toBeDefined()
    expect(handlers['window:close']).toBeDefined()
    expect(handlers['window:hide']).toBeDefined()
    expect(handlers['window:restore']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(5)
  })

  it('window:minimize calls minimizeWindow and returns { ok: true, data }', async () => {
    mockMinimizeWindow.mockReturnValue(undefined)

    const result = await handlers['window:minimize']()

    expect(mockMinimizeWindow).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('window:maximize calls maximizeWindow and returns { ok: true, data }', async () => {
    mockMaximizeWindow.mockReturnValue(undefined)

    const result = await handlers['window:maximize']()

    expect(mockMaximizeWindow).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('window:close calls closeWindow and returns { ok: true, data }', async () => {
    mockCloseWindow.mockReturnValue(undefined)

    const result = await handlers['window:close']()

    expect(mockCloseWindow).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('window:hide calls hideWindow and returns { ok: true, data }', async () => {
    mockHideWindow.mockReturnValue(undefined)

    const result = await handlers['window:hide']()

    expect(mockHideWindow).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('window:restore calls restoreWindow and returns { ok: true, data }', async () => {
    mockRestoreWindow.mockReturnValue(undefined)

    const result = await handlers['window:restore']()

    expect(mockRestoreWindow).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('returns { ok: false, error } when handler throws an Error', async () => {
    mockMinimizeWindow.mockImplementation(() => {
      throw new Error('window error')
    })

    const result = await handlers['window:minimize']()

    expect(result).toEqual({ ok: false, error: 'window error' })
  })

  it('returns { ok: false, error } with stringified non-Error', async () => {
    mockMaximizeWindow.mockImplementation(() => {
      throw 'unexpected'
    })

    const result = await handlers['window:maximize']()

    expect(result).toEqual({ ok: false, error: 'unexpected' })
  })
})
