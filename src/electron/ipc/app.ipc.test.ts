import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

const mockGetVersion = vi.fn()

vi.mock('electron', () => ({
  app: {
    getVersion: (...args: unknown[]) => mockGetVersion(...args),
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

describe('registerAppIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockGetVersion.mockReset()
    vi.resetModules()
    const { registerAppIpc } = await import('./app.ipc')
    registerAppIpc()
  })

  it('registers the app:getVersion channel', () => {
    expect(handlers['app:getVersion']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(1)
  })

  it('returns the app version', async () => {
    mockGetVersion.mockReturnValue('2.0.0-beta.0')

    const result = await handlers['app:getVersion']({})

    expect(mockGetVersion).toHaveBeenCalledOnce()
    expect(result).toEqual({ ok: true, data: '2.0.0-beta.0' })
  })

  it('returns { ok: false, error } when getVersion throws', async () => {
    mockGetVersion.mockImplementation(() => {
      throw new Error('getVersion failed')
    })

    const result = await handlers['app:getVersion']({})

    expect(result).toEqual({ ok: false, error: 'getVersion failed' })
  })

  it('returns { ok: false, error } with stringified non-Error', async () => {
    mockGetVersion.mockImplementation(() => {
      throw 'unexpected'
    })

    const result = await handlers['app:getVersion']({})

    expect(result).toEqual({ ok: false, error: 'unexpected' })
  })
})
