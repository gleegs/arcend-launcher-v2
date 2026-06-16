import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

const mockGetServerStatus = vi.fn()

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

vi.mock('../services/server', () => ({
  getServerStatus: (...args: unknown[]) => mockGetServerStatus(...args),
}))

describe('registerServerIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockGetServerStatus.mockReset()
    vi.resetModules()
    const { registerServerIpc } = await import('./server.ipc')
    registerServerIpc()
  })

  it('registers the server:getStatus channel', () => {
    expect(handlers['server:getStatus']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(1)
  })

  it('returns { ok: true, data } when getServerStatus succeeds', async () => {
    mockGetServerStatus.mockResolvedValue({ online: true, playersOnline: 7, playersMax: 50 })

    const result = await handlers['server:getStatus']({})

    expect(mockGetServerStatus).toHaveBeenCalledOnce()
    expect(result).toEqual({ ok: true, data: { online: true, playersOnline: 7, playersMax: 50 } })
  })

  it('returns { ok: false, error } when getServerStatus throws', async () => {
    mockGetServerStatus.mockRejectedValue(new Error('SERVER_HOST missing'))

    const result = await handlers['server:getStatus']({})

    expect(result).toEqual({ ok: false, error: 'SERVER_HOST missing' })
  })
})
