import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

const mockGetRegistry = vi.fn()
const mockEnsureJava = vi.fn()
const mockInstallJava = vi.fn()
const mockIsInstalled = vi.fn()
const mockGetJavaExecutable = vi.fn()

vi.mock('../services/java', () => ({
  getRegistry: (...args: unknown[]) => mockGetRegistry(...args),
  ensureJava: (...args: unknown[]) => mockEnsureJava(...args),
  installJava: (...args: unknown[]) => mockInstallJava(...args),
  isInstalled: (...args: unknown[]) => mockIsInstalled(...args),
  getJavaExecutable: (...args: unknown[]) => mockGetJavaExecutable(...args),
}))

vi.mock('../services/store', () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn(),
}))

vi.mock('../lib/paths', () => ({
  launcherConfigPath: '/fake/config/path',
}))

describe('registerJavaIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockGetRegistry.mockReset()
    mockEnsureJava.mockReset()
    mockInstallJava.mockReset()
    mockIsInstalled.mockReset()
    mockGetJavaExecutable.mockReset()
    vi.resetModules()
    const { registerJavaIpc } = await import('./java.ipc')
    registerJavaIpc()
  })

  it('registers exactly 5 java channels', () => {
    expect(handlers['java:getRegistry']).toBeDefined()
    expect(handlers['java:ensure']).toBeDefined()
    expect(handlers['java:install']).toBeDefined()
    expect(handlers['java:isInstalled']).toBeDefined()
    expect(handlers['java:getExecutable']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(5)
  })

  it('java:getRegistry calls getRegistry and returns { ok: true, data }', async () => {
    const registry = { installations: {} }
    mockGetRegistry.mockReturnValue(registry)

    const result = await handlers['java:getRegistry']()

    expect(mockGetRegistry).toHaveBeenCalled()
    expect(result).toEqual({ ok: true, data: registry })
  })

  it('java:ensure calls ensureJava with version and returns { ok: true, data }', async () => {
    const installation = {
      version: '21',
      path: '/runtime/java-21',
      installedAt: '2026-01-01',
      arch: 'x64',
    }
    mockEnsureJava.mockResolvedValue(installation)

    const result = await handlers['java:ensure']({}, '21')

    expect(mockEnsureJava).toHaveBeenCalledWith('21')
    expect(result).toEqual({ ok: true, data: installation })
  })

  it('java:install calls installJava with version and returns { ok: true, data }', async () => {
    const installation = {
      version: '17',
      path: '/runtime/java-17',
      installedAt: '2026-01-01',
      arch: 'x64',
    }
    mockInstallJava.mockResolvedValue(installation)

    const result = await handlers['java:install']({}, '17')

    expect(mockInstallJava).toHaveBeenCalledWith('17')
    expect(result).toEqual({ ok: true, data: installation })
  })

  it('java:isInstalled calls isInstalled with version and returns { ok: true, data }', async () => {
    mockIsInstalled.mockReturnValue(true)

    const result = await handlers['java:isInstalled']({}, '21')

    expect(mockIsInstalled).toHaveBeenCalledWith('21')
    expect(result).toEqual({ ok: true, data: true })
  })

  it('java:getExecutable calls getJavaExecutable with version and returns { ok: true, data }', async () => {
    mockGetJavaExecutable.mockReturnValue('/runtime/java-21/bin/java.exe')

    const result = await handlers['java:getExecutable']({}, '21')

    expect(mockGetJavaExecutable).toHaveBeenCalledWith('21')
    expect(result).toEqual({ ok: true, data: '/runtime/java-21/bin/java.exe' })
  })

  it('returns { ok: false, error } when handler throws an Error', async () => {
    mockInstallJava.mockRejectedValue(new Error('install failed'))

    const result = await handlers['java:install']({}, '21')

    expect(result).toEqual({ ok: false, error: 'install failed' })
  })

  it('returns { ok: false, error } with stringified non-Error', async () => {
    mockGetRegistry.mockImplementation(() => {
      throw 'unexpected'
    })

    const result = await handlers['java:getRegistry']()

    expect(result).toEqual({ ok: false, error: 'unexpected' })
  })
})
