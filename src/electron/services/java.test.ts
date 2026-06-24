import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'node:path'

const fakeRuntimeDir = '/fake/arcend/runtime'
const fakeConfigDir = '/fake/arcend/config'
const fakeJavaRegistryPath = path.join(fakeConfigDir, 'java.json')

vi.mock('../lib/paths', () => ({
  runtimeDir: fakeRuntimeDir,
  javaRegistryPath: fakeJavaRegistryPath,
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
  mockFsReaddirSync,
  mockFsStatSync,
  mockFsRenameSync,
  mockFsRmdirSync,
  mockFsUnlinkSync,
  mockFsRmSync,
  mockCreateWriteStream,
} = vi.hoisted(() => ({
  mockFsExistsSync: vi.fn(),
  mockFsReadFileSync: vi.fn(),
  mockFsWriteFileSync: vi.fn(),
  mockFsMkdirSync: vi.fn(),
  mockFsReaddirSync: vi.fn(),
  mockFsStatSync: vi.fn(),
  mockFsRenameSync: vi.fn(),
  mockFsRmdirSync: vi.fn(),
  mockFsUnlinkSync: vi.fn(),
  mockFsRmSync: vi.fn(),
  mockCreateWriteStream: vi.fn(),
}))

vi.mock('node:fs', () => {
  const fns = {
    existsSync: (...args: unknown[]) => mockFsExistsSync(...args),
    readFileSync: (...args: unknown[]) => mockFsReadFileSync(...args),
    writeFileSync: (...args: unknown[]) => mockFsWriteFileSync(...args),
    mkdirSync: (...args: unknown[]) => mockFsMkdirSync(...args),
    readdirSync: (...args: unknown[]) => mockFsReaddirSync(...args),
    statSync: (...args: unknown[]) => mockFsStatSync(...args),
    renameSync: (...args: unknown[]) => mockFsRenameSync(...args),
    rmdirSync: (...args: unknown[]) => mockFsRmdirSync(...args),
    unlinkSync: (...args: unknown[]) => mockFsUnlinkSync(...args),
    rmSync: (...args: unknown[]) => mockFsRmSync(...args),
    createWriteStream: (...args: unknown[]) => mockCreateWriteStream(...args),
  }
  return { __esModule: true, default: fns, ...fns }
})

vi.mock('node:https', () => ({
  default: {
    get: vi.fn(),
  },
}))

const mockAdmZipInstances: Array<{
  getEntries: ReturnType<typeof vi.fn>
  extractEntryTo: ReturnType<typeof vi.fn>
}> = []

vi.mock('adm-zip', () => ({
  default: vi.fn(function () {
    const instance = {
      getEntries: vi.fn(() => []),
      extractEntryTo: vi.fn(),
    }
    mockAdmZipInstances.push(instance)
    return instance
  }),
}))

function mockHttpsGet(response: {
  statusCode?: number
  headers?: Record<string, string>
  data?: string
  error?: Error
}) {
  return vi.fn((_url: string, callback: (res: unknown) => void) => {
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
      on: vi.fn((event: string, cb: (chunk?: string) => void) => {
        if (event === 'data') cb(response.data)
        if (event === 'end') cb()
      }),
      pipe: vi.fn(),
    }
    callback(res)
    return { on: vi.fn() }
  })
}

describe('java service', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFsExistsSync.mockReset()
    mockFsReadFileSync.mockReset()
    mockFsWriteFileSync.mockReset()
    mockFsMkdirSync.mockReset()
    mockFsReaddirSync.mockReset()
    mockFsStatSync.mockReset()
    mockFsRenameSync.mockReset()
    mockFsRmdirSync.mockReset()
    mockFsUnlinkSync.mockReset()
    mockFsRmSync.mockReset()
    mockCreateWriteStream.mockReset()
    mockGetMainWindow.mockReset()
    mockAdmZipInstances.length = 0
    mockGetMainWindow.mockReturnValue(null)
  })

  describe('getRegistry', () => {
    it('returns empty registry when file does not exist', async () => {
      mockFsExistsSync.mockReturnValue(false)

      const { getRegistry } = await import('./java')
      const result = getRegistry()

      expect(result).toEqual({ installations: {} })
    })

    it('returns parsed registry when file exists', async () => {
      mockFsExistsSync.mockReturnValue(true)
      const registry = { installations: { '21': { version: '21', path: '/java-21' } } }
      mockFsReadFileSync.mockReturnValue(JSON.stringify(registry))

      const { getRegistry } = await import('./java')
      const result = getRegistry()

      expect(result).toEqual(registry)
    })

    it('returns empty registry when file is corrupted', async () => {
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue('not json{{{')

      const { getRegistry } = await import('./java')
      const result = getRegistry()

      expect(result).toEqual({ installations: {} })
    })
  })

  describe('isInstalled', () => {
    it('returns true when version exists in registry and path exists', async () => {
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify({ installations: { '21': { version: '21', path: '/java-21' } } })
      )

      const { isInstalled } = await import('./java')
      expect(isInstalled('21')).toBe(true)
    })

    it('returns false when version not in registry', async () => {
      mockFsExistsSync.mockReturnValue(false)

      const { isInstalled } = await import('./java')
      expect(isInstalled('17')).toBe(false)
    })

    it('returns false when version in registry but path does not exist', async () => {
      let callCount = 0
      mockFsExistsSync.mockImplementation(() => {
        callCount++
        return callCount === 1
      })
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify({ installations: { '21': { version: '21', path: '/java-21' } } })
      )

      const { isInstalled } = await import('./java')
      expect(isInstalled('21')).toBe(false)
    })
  })

  describe('getJavaPath', () => {
    it('returns correct path for a version', async () => {
      const { getJavaPath } = await import('./java')
      expect(getJavaPath('21')).toBe(path.join(fakeRuntimeDir, 'java-21'))
    })
  })

  describe('getJavaExecutable', () => {
    it('returns executable path when installed', async () => {
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(
        JSON.stringify({ installations: { '21': { version: '21', path: '/java-21' } } })
      )

      const { getJavaExecutable } = await import('./java')
      const result = getJavaExecutable('21')
      const expectedExe = process.platform === 'win32' ? 'java.exe' : 'java'
      expect(result).toBe(path.join('/java-21', 'bin', expectedExe))
    })

    it('throws when version is not installed', async () => {
      mockFsExistsSync.mockReturnValue(false)

      const { getJavaExecutable } = await import('./java')
      expect(() => getJavaExecutable('21')).toThrow('Java 21 is not installed')
    })

    it('throws when executable file does not exist', async () => {
      const registry = JSON.stringify({
        installations: { '21': { version: '21', path: '/java-21' } },
      })
      mockFsReadFileSync.mockReturnValue(registry)
      let existsCallCount = 0
      mockFsExistsSync.mockImplementation(() => {
        existsCallCount++
        return existsCallCount <= 3
      })

      const { getJavaExecutable } = await import('./java')
      expect(() => getJavaExecutable('21')).toThrow(/Java executable not found/)
    })
  })

  describe('validateVersion', () => {
    it('throws when version is empty', async () => {
      const { isInstalled } = await import('./java')
      expect(() => isInstalled('')).toThrow('Java version is required')
    })

    it('throws when version is not a string (at runtime)', async () => {
      const { isInstalled } = await import('./java')
      expect(() => isInstalled(null as unknown as string)).toThrow('Java version is required')
    })
  })

  describe('installJava', () => {
    it('completes full install flow', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({
        statusCode: 200,
        data: JSON.stringify([
          {
            binary: {
              package: { link: 'https://example.com/jre.zip', name: 'jre.zip', size: 100 },
            },
          },
        ]),
      })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValueOnce(
        JSON.stringify({ installations: { '21': { version: '21', path: '/java-21' } } })
      )

      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)

      const mockZip = {
        getEntries: vi.fn(() => [{ entryName: 'file1.jar' }]),
        extractEntryTo: vi.fn(),
      }
      mockAdmZipInstances.push(mockZip)

      mockFsReaddirSync.mockReturnValue([])

      const { installJava } = await import('./java')
      const result = await installJava('21')

      expect(result.version).toBe('21')
      expect(result.path).toContain('java-21')
      expect(mockFsWriteFileSync).toHaveBeenCalled()
    })
  })

  describe('ensureJava', () => {
    it('returns existing installation when already installed', async () => {
      const existing = { version: '21', path: '/java-21', installedAt: '2026-01-01', arch: 'x64' }
      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installations: { '21': existing } }))

      const { ensureJava } = await import('./java')
      const result = await ensureJava('21')

      expect(result).toEqual(existing)
    })

    it('calls installJava when not installed', async () => {
      mockFsExistsSync.mockReturnValue(false)

      const https = await import('node:https')
      const mockGet = mockHttpsGet({
        statusCode: 200,
        data: JSON.stringify([
          {
            binary: {
              package: { link: 'https://example.com/jre.zip', name: 'jre.zip', size: 100 },
            },
          },
        ]),
      })
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

      const mockZip = {
        getEntries: vi.fn(() => []),
        extractEntryTo: vi.fn(),
      }
      mockAdmZipInstances.push(mockZip)

      mockFsExistsSync.mockReturnValue(false)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installations: {} }))
      mockFsReaddirSync.mockReturnValue([])

      const { ensureJava } = await import('./java')
      const result = await ensureJava('17')

      expect(result.version).toBe('17')
    })
  })

  describe('fetchJreDownloadUrl (via installJava)', () => {
    it('rejects when no JRE package found', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({
        statusCode: 200,
        data: JSON.stringify([]),
      })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)

      const { installJava } = await import('./java')
      await expect(installJava('99')).rejects.toThrow('No JRE package found for Java 99')
    })

    it('handles API parse error', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({
        statusCode: 200,
        data: 'invalid-json{{{',
      })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)

      const { installJava } = await import('./java')
      await expect(installJava('21')).rejects.toThrow('Failed to parse Adoptium API response')
    })
  })

  describe('downloadFile (via installJava)', () => {
    it('rejects on HTTP error status', async () => {
      const https = await import('node:https')
      let callCount = 0
      const mockGet = vi.fn((_url: string, callback: (res: unknown) => void) => {
        callCount++
        if (callCount === 1) {
          const pkg = {
            binary: {
              package: { link: 'https://cdn.example.com/jre.zip', name: 'jre.zip', size: 100 },
            },
          }
          const res = {
            statusCode: 200,
            headers: {},
            on: vi.fn((event: string, cb: (chunk?: string) => void) => {
              if (event === 'data') cb(JSON.stringify([pkg]))
              if (event === 'end') cb()
            }),
            pipe: vi.fn(),
          }
          callback(res)
          return { on: vi.fn() }
        }
        const res = {
          statusCode: 404,
          headers: {},
          on: vi.fn((event: string, cb: (chunk?: string) => void) => {
            if (event === 'end') cb()
          }),
          pipe: vi.fn(),
        }
        callback(res)
        return { on: vi.fn() }
      })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)

      const { installJava } = await import('./java')
      await expect(installJava('21')).rejects.toThrow('Download failed with status 404')
    })
  })

  describe('extractJre (via installJava)', () => {
    it('flattens nested directory when zip contains a single root folder', async () => {
      const https = await import('node:https')
      const mockGet = mockHttpsGet({
        statusCode: 200,
        data: JSON.stringify([
          {
            binary: {
              package: { link: 'https://example.com/jre.zip', name: 'jre.zip', size: 100 },
            },
          },
        ]),
      })
      vi.mocked(https.default.get).mockImplementation(mockGet as never)

      mockFsExistsSync.mockReturnValue(true)
      mockFsReadFileSync.mockReturnValue(JSON.stringify({ installations: {} }))

      const mockFile = {
        on: vi.fn((event: string, cb: () => void) => {
          if (event === 'finish') cb()
        }),
        close: vi.fn((cb?: () => void) => {
          if (cb) cb()
        }),
      }
      mockCreateWriteStream.mockReturnValue(mockFile)

      const mockZip = {
        getEntries: vi.fn(() => [{ entryName: 'jdk-21/bin/java' }]),
        extractEntryTo: vi.fn(),
      }
      mockAdmZipInstances.push(mockZip)

      mockFsReaddirSync.mockReturnValue(['jdk-21'])
      mockFsStatSync.mockReturnValue({ isDirectory: () => true } as never)
      mockFsReaddirSync.mockReturnValueOnce(['jdk-21']).mockReturnValueOnce(['bin', 'lib'])

      const { installJava } = await import('./java')
      const result = await installJava('21')

      expect(mockFsRenameSync).toHaveBeenCalledTimes(2)
      expect(mockFsRmdirSync).toHaveBeenCalled()
      expect(result.version).toBe('21')
    })
  })
})
