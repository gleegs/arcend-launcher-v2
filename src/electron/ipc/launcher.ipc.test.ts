import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

const mockLaunchGame = vi.fn()
const mockCancelLaunch = vi.fn()
const mockIsGameRunning = vi.fn()

vi.mock('../services/launcher', () => ({
  launchGame: (...args: unknown[]) => mockLaunchGame(...args),
  cancelLaunch: (...args: unknown[]) => mockCancelLaunch(...args),
  isGameRunning: (...args: unknown[]) => mockIsGameRunning(...args),
}))

describe('registerLauncherIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockLaunchGame.mockReset()
    mockCancelLaunch.mockReset()
    mockIsGameRunning.mockReset()
    vi.resetModules()
    const { registerLauncherIpc } = await import('./launcher.ipc')
    registerLauncherIpc()
  })

  it('registers exactly 3 launcher channels', () => {
    expect(handlers['launch:game']).toBeDefined()
    expect(handlers['launch:cancel']).toBeDefined()
    expect(handlers['launch:isRunning']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(3)
  })

  it('launch:cancel calls cancelLaunch and returns { ok: true, data }', async () => {
    mockCancelLaunch.mockReturnValue(undefined)

    const result = await handlers['launch:cancel']()

    expect(mockCancelLaunch).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('launch:game calls launchGame with typed arguments and returns { ok: true, data }', async () => {
    const options = { arcId: 'test-arc', mode: 'online' as const }
    mockLaunchGame.mockResolvedValue(undefined)

    const result = await handlers['launch:game']({}, options)

    expect(mockLaunchGame).toHaveBeenCalledWith(options)
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('launch:game passes options with optional memory settings', async () => {
    const options = {
      arcId: 'test-arc',
      mode: 'offline' as const,
      maxMemory: '8G',
      minMemory: '4G',
    }
    mockLaunchGame.mockResolvedValue(undefined)

    const result = await handlers['launch:game']({}, options)

    expect(mockLaunchGame).toHaveBeenCalledWith(options)
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('launch:isRunning calls isGameRunning and returns { ok: true, data }', async () => {
    mockIsGameRunning.mockReturnValue(true)

    const result = await handlers['launch:isRunning']()

    expect(mockIsGameRunning).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: true })
  })

  it('launch:isRunning returns false when no game is running', async () => {
    mockIsGameRunning.mockReturnValue(false)

    const result = await handlers['launch:isRunning']()

    expect(result).toEqual({ ok: true, data: false })
  })

  it('returns { ok: false, error } when launchGame throws an Error', async () => {
    mockLaunchGame.mockRejectedValue(new Error('launch failed'))

    const result = await handlers['launch:game']({}, { arcId: 'test-arc', mode: 'online' })

    expect(result).toEqual({ ok: false, error: 'launch failed' })
  })

  it('returns { ok: false, error } with stringified non-Error', async () => {
    mockIsGameRunning.mockImplementation(() => {
      throw 'unexpected'
    })

    const result = await handlers['launch:isRunning']()

    expect(result).toEqual({ ok: false, error: 'unexpected' })
  })
})
