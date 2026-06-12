import { describe, it, expect, vi, beforeEach } from 'vitest'

const handlers: Record<string, (...args: unknown[]) => unknown> = {}

const mockOpenPath = vi.fn()

vi.mock('electron', () => ({
  shell: {
    openPath: (...args: unknown[]) => mockOpenPath(...args),
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers[channel] = handler
    }),
  },
}))

const mockArcendDir = '/fake/arcend/dir'

vi.mock('../lib/paths', () => ({
  arcendDir: mockArcendDir,
}))

vi.mock('../services/store', () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn(),
}))

describe('registerShellIpc', () => {
  beforeEach(async () => {
    Object.keys(handlers).forEach((k) => delete handlers[k])
    mockOpenPath.mockReset()
    vi.resetModules()
    const { registerShellIpc } = await import('./shell.ipc')
    registerShellIpc()
  })

  it('registers the shell:openPath channel', () => {
    expect(handlers['shell:openPath']).toBeDefined()
    expect(Object.keys(handlers)).toHaveLength(1)
  })

  it('calls electronShell.openPath with the provided path', async () => {
    mockOpenPath.mockResolvedValue('')

    const result = await handlers['shell:openPath']({}, '/some/path')

    expect(mockOpenPath).toHaveBeenCalledWith('/some/path')
    expect(result).toEqual({ ok: true, data: undefined })
  })

  it('falls back to arcendDir when path is empty', async () => {
    mockOpenPath.mockResolvedValue('')

    await handlers['shell:openPath']({}, '')

    expect(mockOpenPath).toHaveBeenCalledWith(mockArcendDir)
  })

  it('returns { ok: false, error } when openPath throws', async () => {
    mockOpenPath.mockRejectedValue(new Error('open failed'))

    const result = await handlers['shell:openPath']({}, '/bad/path')

    expect(result).toEqual({ ok: false, error: 'open failed' })
  })

  it('returns { ok: false, error } with stringified non-Error', async () => {
    mockOpenPath.mockRejectedValue('unexpected')

    const result = await handlers['shell:openPath']({}, '/bad/path')

    expect(result).toEqual({ ok: false, error: 'unexpected' })
  })
})
