import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

const mockGetUpdateStatus = vi.fn()
const mockInstallUpdate = vi.fn()

vi.mock('../services/updater', () => ({
  getUpdateStatus: (...args: unknown[]) => mockGetUpdateStatus(...args),
  installUpdate: (...args: unknown[]) => mockInstallUpdate(...args),
}))

describe('registerUpdaterIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockGetUpdateStatus.mockReset()
    mockInstallUpdate.mockReset()
    vi.resetModules()
    const { registerUpdaterIpc } = await import('./updater.ipc')
    registerUpdaterIpc()
  })

  it('registers exactly 2 updater channels', () => {
    expect(handlers['updater:getStatus']).toBeDefined()
    expect(handlers['updater:install']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(2)
  })

  it('updater:getStatus calls getUpdateStatus and returns { ok: true, data }', async () => {
    mockGetUpdateStatus.mockReturnValue({ updateReady: false, version: null })

    const result = await handlers['updater:getStatus']()

    expect(mockGetUpdateStatus).toHaveBeenCalledOnce()
    expect(result).toEqual({ ok: true, data: { updateReady: false, version: null } })
  })

  it('updater:getStatus returns ready state with version', async () => {
    mockGetUpdateStatus.mockReturnValue({ updateReady: true, version: '2.0.0-beta.2' })

    const result = await handlers['updater:getStatus']()

    expect(result).toEqual({ ok: true, data: { updateReady: true, version: '2.0.0-beta.2' } })
  })

  it('updater:install calls installUpdate and returns { ok: true, data }', async () => {
    mockInstallUpdate.mockReturnValue(undefined)

    const result = await handlers['updater:install']()

    expect(mockInstallUpdate).toHaveBeenCalledOnce()
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('returns { ok: false, error } when getUpdateStatus throws', async () => {
    mockGetUpdateStatus.mockImplementation(() => {
      throw new Error('status failed')
    })

    const result = await handlers['updater:getStatus']()

    expect(result).toEqual({ ok: false, error: 'status failed' })
  })

  it('returns { ok: false, error } when installUpdate throws', async () => {
    mockInstallUpdate.mockImplementation(() => {
      throw new Error('install failed')
    })

    const result = await handlers['updater:install']()

    expect(result).toEqual({ ok: false, error: 'install failed' })
  })
})
