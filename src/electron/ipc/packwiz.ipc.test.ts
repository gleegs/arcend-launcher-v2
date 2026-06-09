import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

const mockEnsurePackwiz = vi.fn()
const mockInstallPackwiz = vi.fn()
const mockIsInstalled = vi.fn()
const mockGetJarPath = vi.fn()

vi.mock('../services/packwiz', () => ({
  ensurePackwiz: (...args: unknown[]) => mockEnsurePackwiz(...args),
  installPackwiz: (...args: unknown[]) => mockInstallPackwiz(...args),
  isInstalled: (...args: unknown[]) => mockIsInstalled(...args),
  getJarPath: (...args: unknown[]) => mockGetJarPath(...args),
}))

vi.mock('../lib/paths', () => ({
  launcherConfigPath: '/fake/config/path',
}))

describe('registerPackwizIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockEnsurePackwiz.mockReset()
    mockInstallPackwiz.mockReset()
    mockIsInstalled.mockReset()
    mockGetJarPath.mockReset()
    vi.resetModules()
    const { registerPackwizIpc } = await import('./packwiz.ipc')
    registerPackwizIpc()
  })

  it('registers exactly 4 packwiz channels', () => {
    expect(handlers['packwiz:ensure']).toBeDefined()
    expect(handlers['packwiz:install']).toBeDefined()
    expect(handlers['packwiz:isInstalled']).toBeDefined()
    expect(handlers['packwiz:getJarPath']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(4)
  })

  it('packwiz:ensure calls ensurePackwiz and returns { ok: true, data }', async () => {
    const installation = {
      version: '0.0.3',
      jarPath: '/runtime/packwiz/packwiz-installer-bootstrap.jar',
      installedAt: '2026-01-01',
    }
    mockEnsurePackwiz.mockResolvedValue(installation)

    const result = await handlers['packwiz:ensure']()

    expect(mockEnsurePackwiz).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: installation })
  })

  it('packwiz:install calls installPackwiz and returns { ok: true, data }', async () => {
    const installation = {
      version: '0.0.3',
      jarPath: '/runtime/packwiz/packwiz-installer-bootstrap.jar',
      installedAt: '2026-01-01',
    }
    mockInstallPackwiz.mockResolvedValue(installation)

    const result = await handlers['packwiz:install']()

    expect(mockInstallPackwiz).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: installation })
  })

  it('packwiz:isInstalled calls isInstalled and returns { ok: true, data }', async () => {
    mockIsInstalled.mockReturnValue(true)

    const result = await handlers['packwiz:isInstalled']()

    expect(mockIsInstalled).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: true })
  })

  it('packwiz:getJarPath calls getJarPath and returns { ok: true, data }', async () => {
    mockGetJarPath.mockReturnValue('/runtime/packwiz/packwiz-installer-bootstrap.jar')

    const result = await handlers['packwiz:getJarPath']()

    expect(mockGetJarPath).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: '/runtime/packwiz/packwiz-installer-bootstrap.jar' })
  })

  it('returns { ok: false, error } when handler throws an Error', async () => {
    mockInstallPackwiz.mockRejectedValue(new Error('download failed'))

    const result = await handlers['packwiz:install']()

    expect(result).toEqual({ ok: false, error: 'download failed' })
  })

  it('returns { ok: false, error } with stringified non-Error', async () => {
    mockIsInstalled.mockImplementation(() => {
      throw 'unexpected'
    })

    const result = await handlers['packwiz:isInstalled']()

    expect(result).toEqual({ ok: false, error: 'unexpected' })
  })
})
