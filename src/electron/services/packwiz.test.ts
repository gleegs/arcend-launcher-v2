import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'node:path'

const fakeRuntimeDir = '/fake/arcend/runtime'
const fakeConfigDir = '/fake/arcend/config'
const fakePackwizDir = path.join(fakeRuntimeDir, 'packwiz')
const fakePackwizRegistryPath = path.join(fakeConfigDir, 'packwiz.json')

vi.mock('../lib/paths', () => ({
  packwizDir: fakePackwizDir,
  packwizRegistryPath: fakePackwizRegistryPath,
}))

const mockGetMainWindow = vi.fn()

vi.mock('./window', () => ({
  getMainWindow: () => mockGetMainWindow(),
}))

const {
  mockFsExistsSync,
  mockFsReadFileSync,
  mockFsWriteFileSync,
  mockFsMkdirSync,
  mockFsUnlinkSync,
  mockCreateWriteStream,
} = vi.hoisted(() => ({
  mockFsExistsSync: vi.fn(),
  mockFsReadFileSync: vi.fn(),
  mockFsWriteFileSync: vi.fn(),
  mockFsMkdirSync: vi.fn(),
  mockFsUnlinkSync: vi.fn(),
  mockCreateWriteStream: vi.fn(),
}))

vi.mock('node:fs', () => {
  const fns = {
    existsSync: (...args: unknown[]) => mockFsExistsSync(...args),
    readFileSync: (...args: unknown[]) => mockFsReadFileSync(...args),
    writeFileSync: (...args: unknown[]) => mockFsWriteFileSync(...args),
    mkdirSync: (...args: unknown[]) => mockFsMkdirSync(...args),
    unlinkSync: (...args: unknown[]) => mockFsUnlinkSync(...args),
    createWriteStream: (...args: unknown[]) => mockCreateWriteStream(...args),
  }
  return { __esModule: true, default: fns, ...fns }
})

vi.mock('node:https', () => ({
  default: {
    get: vi.fn(),
  },
}))

function mockHttpsGet(response: {
  statusCode?: number
  headers?: Record<string, string>
  data?: Buffer
  error?: Error
}) {
  return vi.fn((url: string, callback: (res: unknown) => void) => {
    if (response.error) {
      return {
        on: vi.fn((event: string, cb: (err: Error) => void) => {
          if (event === 'error') cb(response.error as Error)
        }),
      }
    }

    const res = {
      statusCode: response.statusCode ?? 200,
      headers: response.headers ?? {},
      on: vi.fn((event: string, cb: (chunk?: Buffer) => void) => {
        if (event === 'data') cb(response.data ?? Buffer.from('jar-content'))
        if (event === 'end') cb()
      }),
      pipe: vi.fn(),
    }
    callback(res)
    return { on: vi.fn() }
  })
}

describe('packwiz service', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFsExistsSync.mockReset()
    mockFsReadFileSync.mockReset()
    mockFsWriteFileSync.mockReset()
    mockFsMkdirSync.mockReset()
    mockFsUnlinkSync.mockReset()
    mockCreateWriteStream.mockReset()
    mockGetMainWindow.mockReset()
    mockGetMainWindow.mockReturnValue(null)
  })

  describe('getRegistry', () => {
    it('returns empty registry when file does not exist', async () => {
      mockFsExistsSync.mockReturnValue(false)

      const { getRegistry } = await import('./packwiz')
      const result = getRegistry()

      expect(result).toEqual({ installation: null })
    })

    it('returns parsed registry when file exists and is valid', async () => {
      mockFsExistsSync.mockReturnValue(true)
      const registry = {
        installation: {
          version: '0.0.3',
          jarPath: '/runtime/packwiz/packwiz-installer-bootstrap.jar',
          installedAt: '2026-01-01',
        },
      }
      mockFsReadFileSync.mockReturnValue(JSON.stringify(registry))

      const { getRegistry } = await import('./packwiz')
      const result = getRegistry()

      expect(result).toEqual(registry)
    })

    it('returns empty registry when file is corrupted', async () => {
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue('not json{{{')

      const { getRegistry } = await import('./packwiz')
      const result = getRegistry()

      expect(result).toEqual({ installation: null })
    })
  })

  describe('getJarPath', () => {
    it('returns correct jar path', async () => {
      const { getJarPath } = await import('./packwiz')
      expect(getJarPath()).toBe(path.join(fakePackwizDir, 'packwiz-installer-bootstrap.jar'))
    })
  })

  describe('isInstalled', () => {
    it('returns true when registry has installation and jar file exists', async () => {
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify({
          installation: {
            version: 'v0.0.3',
            jarPath: '/runtime/packwiz/packwiz-installer-bootstrap.jar',
            installedAt: '2026-01-01',
          },
        })
      )

      const { isInstalled } = await import('./packwiz')
      expect(isInstalled()).toBe(true)
    })

    it('returns false when registry has no installation', async () => {
      mockFsExistsSync.mockReturnValue(false)

      const { isInstalled } = await import('./packwiz')
      expect(isInstalled()).toBe(false)
    })

    it('returns false when registry has installation but jar file does not exist', async () => {
      let callCount = 0
      mockFsExistsSync.mockImplementation(() => {
        callCount++
        return callCount === 1
      })
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify({
          installation: {
            version: 'v0.0.3',
            jarPath: '/runtime/packwiz/packwiz-installer-bootstrap.jar',
            installedAt: '2026-01-01',
          },
        })
      )

      const { isInstalled } = await import('./packwiz')
      expect(isInstalled()).toBe(false)
    })
  })

  describe('installPackwiz', () => {
    it('completes full install flow', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({ statusCode: 200 })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installation: null }))

      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)

      const mockWebContents = { send: vi.fn() }
      mockGetMainWindow.mockReturnValue({ isDestroyed: () => false, webContents: mockWebContents })

      const { installPackwiz } = await import('./packwiz')
      const result = await installPackwiz()

      expect(result.version).toBe('v0.0.3')
      expect(result.jarPath).toBe(path.join(fakePackwizDir, 'packwiz-installer-bootstrap.jar'))
      expect(result.installedAt).toBeDefined()
      expect(mockFsWriteFileSync).toHaveBeenCalled()
      expect(mockWebContents.send).toHaveBeenCalledWith('packwiz:onInstallProgress', {
        percent: 100,
        status: 'done',
      })
    })

    it('creates packwiz directory when it does not exist', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({ statusCode: 200 })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      let existsCallCount = 0
      mockFsExistsSync.mockImplementation(() => {
        existsCallCount++
        return existsCallCount <= 1 ? false : true
      })
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installation: null }))

      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)

      const { installPackwiz } = await import('./packwiz')
      await installPackwiz()

      expect(mockFsMkdirSync).toHaveBeenCalledWith(fakePackwizDir, { recursive: true })
    })
  })

  describe('downloadJar', () => {
    it('follows redirect 3xx', async () => {
      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)

      const https = await import('node:https')
      let callCount = 0
      const mockGet = vi.fn((url: string, callback: (res: unknown) => void) => {
        callCount++
        if (callCount === 1) {
          const res = {
            statusCode: 301,
            headers: { location: 'https://cdn.example.com/packwiz.jar' },
            on: vi.fn(),
            pipe: vi.fn(),
          }
          callback(res)
          return { on: vi.fn() }
        }
        const res = {
          statusCode: 200,
          headers: {},
          on: vi.fn((event: string, cb: (chunk?: Buffer) => void) => {
            if (event === 'data') cb(Buffer.from('jar-content'))
            if (event === 'end') cb()
          }),
          pipe: vi.fn(),
        }
        callback(res)
        return { on: vi.fn() }
      })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installation: null }))

      const { installPackwiz } = await import('./packwiz')
      const result = await installPackwiz()

      expect(mockGet).toHaveBeenCalledTimes(2)
      expect(result.version).toBe('v0.0.3')
    })

    it('rejects on HTTP error status 4xx', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({ statusCode: 403 })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)

      const { installPackwiz } = await import('./packwiz')
      await expect(installPackwiz()).rejects.toThrow('Download failed with status 403')
    })

    it('rejects on HTTP error status 5xx', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({ statusCode: 500 })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)

      const { installPackwiz } = await import('./packwiz')
      await expect(installPackwiz()).rejects.toThrow('Download failed with status 500')
    })

    it('cleans up file on network error', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({ error: new Error('network failure') })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)

      const { installPackwiz } = await import('./packwiz')
      await expect(installPackwiz()).rejects.toThrow('network failure')
      expect(mockFsUnlinkSync).toHaveBeenCalled()
    })
  })

  describe('ensurePackwiz', () => {
    it('returns existing installation when already installed', async () => {
      const existing = {
        version: '0.0.3',
        jarPath: '/runtime/packwiz/packwiz-installer-bootstrap.jar',
        installedAt: '2026-01-01',
      }
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installation: existing }))

      const { ensurePackwiz } = await import('./packwiz')
      const result = await ensurePackwiz()

      expect(result).toEqual(existing)
    })

    it('calls installPackwiz when not installed', async () => {
      mockFsExistsSync.mockReturnValue(false)

      const https = await import('node:https')
      const mockGet = mockHttpsGet({ statusCode: 200 })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installation: null }))

      const { ensurePackwiz } = await import('./packwiz')
      const result = await ensurePackwiz()

      expect(result.version).toBe('v0.0.3')
      expect(mockFsWriteFileSync).toHaveBeenCalled()
    })

    it('calls installPackwiz when registry exists but jar file is missing', async () => {
      let existsCallCount = 0
      mockFsExistsSync.mockImplementation(() => {
        existsCallCount++
        return existsCallCount === 1
      })
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify({
          installation: {
            version: 'v0.0.3',
            jarPath: '/runtime/packwiz/packwiz-installer-bootstrap.jar',
            installedAt: '2026-01-01',
          },
        })
      )

      const https = await import('node:https')
      const mockGet = mockHttpsGet({ statusCode: 200 })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)

      const { ensurePackwiz } = await import('./packwiz')
      const result = await ensurePackwiz()

      expect(result.version).toBe('v0.0.3')
      expect(mockFsWriteFileSync).toHaveBeenCalled()
    })
  })

  describe('sendProgress', () => {
    it('sends progress when window exists and is not destroyed', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({ statusCode: 200 })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installation: null }))

      const mockWebContents = { send: vi.fn() }
      mockGetMainWindow.mockReturnValue({
        isDestroyed: () => false,
        webContents: mockWebContents,
      })

      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)

      const { installPackwiz } = await import('./packwiz')
      await installPackwiz()

      expect(mockWebContents.send).toHaveBeenCalledWith('packwiz:onInstallProgress', {
        percent: 100,
        status: 'done',
      })
    })

    it('does not throw when window is null', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({ statusCode: 200 })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installation: null }))
      mockGetMainWindow.mockReturnValue(null)

      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)

      const { installPackwiz } = await import('./packwiz')
      const result = await installPackwiz()

      expect(result.version).toBe('v0.0.3')
    })

    it('does not throw when window is destroyed', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({ statusCode: 200 })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installation: null }))
      mockGetMainWindow.mockReturnValue({ isDestroyed: () => true, webContents: { send: vi.fn() } })

      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)

      const { installPackwiz } = await import('./packwiz')
      const result = await installPackwiz()

      expect(result.version).toBe('v0.0.3')
    })
  })
})
