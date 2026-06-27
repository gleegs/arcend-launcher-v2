import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

const mockFetchServerStatus = vi.fn()

vi.mock('../services/server', () => ({
  fetchServerStatus: (...args: unknown[]) => mockFetchServerStatus(...args),
}))

describe('registerServerIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockFetchServerStatus.mockReset()
    vi.resetModules()
    const { registerServerIpc } = await import('./server.ipc')
    registerServerIpc()
  })

  it('registers the server:fetchStatus channel', () => {
    expect(handlers['server:fetchStatus']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(1)
  })

  it('returns the server status', async () => {
    mockFetchServerStatus.mockResolvedValue({ online: true, players: 19, maxPlayers: 100 })

    const result = await handlers['server:fetchStatus']()

    expect(mockFetchServerStatus).toHaveBeenCalledOnce()
    expect(result).toEqual({ ok: true, data: { online: true, players: 19, maxPlayers: 100 } })
  })
})
