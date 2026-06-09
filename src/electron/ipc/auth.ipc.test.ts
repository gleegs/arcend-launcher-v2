import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

const mockLogin = vi.fn()
const mockLogout = vi.fn()
const mockRefresh = vi.fn()
const mockGetAuthState = vi.fn()

vi.mock('../services/auth', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  logout: (...args: unknown[]) => mockLogout(...args),
  refresh: (...args: unknown[]) => mockRefresh(...args),
  getAuthState: (...args: unknown[]) => mockGetAuthState(...args),
}))

vi.mock('../services/store', () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn(),
}))

vi.mock('../lib/paths', () => ({
  launcherConfigPath: '/fake/config/path',
}))

describe('registerAuthIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockLogin.mockReset()
    mockLogout.mockReset()
    mockRefresh.mockReset()
    mockGetAuthState.mockReset()
    vi.resetModules()
    const { registerAuthIpc } = await import('./auth.ipc')
    registerAuthIpc()
  })

  it('registers exactly 4 auth channels', () => {
    expect(handlers['auth:login']).toBeDefined()
    expect(handlers['auth:logout']).toBeDefined()
    expect(handlers['auth:refresh']).toBeDefined()
    expect(handlers['auth:getState']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(4)
  })

  it('auth:login calls login and returns { ok: true, data }', async () => {
    const authState = { status: 'online' as const, profile: { id: '1', name: 'Player' } }
    mockLogin.mockResolvedValue(authState)

    const result = await handlers['auth:login']({})

    expect(mockLogin).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: authState })
  })

  it('auth:logout calls logout and returns { ok: true, data }', async () => {
    mockLogout.mockResolvedValue(undefined)

    const result = await handlers['auth:logout']({})

    expect(mockLogout).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('auth:refresh calls refresh and returns { ok: true, data }', async () => {
    const authState = { status: 'online' as const, profile: { id: '1', name: 'Player' } }
    mockRefresh.mockResolvedValue(authState)

    const result = await handlers['auth:refresh']({})

    expect(mockRefresh).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: authState })
  })

  it('auth:getState calls getAuthState and returns { ok: true, data }', async () => {
    const authState = { status: 'unauthenticated' as const }
    mockGetAuthState.mockReturnValue(authState)

    const result = await handlers['auth:getState']({})

    expect(mockGetAuthState).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: authState })
  })

  it('returns { ok: false, error } when handler throws an Error', async () => {
    mockLogin.mockRejectedValue(new Error('auth failed'))

    const result = await handlers['auth:login']({})

    expect(result).toEqual({ ok: false, error: 'auth failed' })
  })

  it('returns { ok: false, error } with stringified non-Error', async () => {
    mockRefresh.mockRejectedValue('unexpected')

    const result = await handlers['auth:refresh']({})

    expect(result).toEqual({ ok: false, error: 'unexpected' })
  })
})
