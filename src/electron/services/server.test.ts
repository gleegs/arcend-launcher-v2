import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

function encodeVarInt(value: number): Buffer {
  const bytes: number[] = []
  let v = value
  while ((v & ~0x7f) !== 0) {
    bytes.push((v & 0x7f) | 0x80)
    v >>>= 7
  }
  bytes.push(v & 0x7f)
  return Buffer.from(bytes)
}

function buildStatusResponse(playersOnline: number, playersMax: number): Buffer {
  const json = JSON.stringify({ players: { online: playersOnline, max: playersMax } })
  const jsonBuf = Buffer.from(json, 'utf8')
  const payload = Buffer.concat([encodeVarInt(0x00), encodeVarInt(jsonBuf.length), jsonBuf])
  return Buffer.concat([encodeVarInt(payload.length), payload])
}

const mockSockets: EventEmitter[] = []

vi.mock('node:net', () => ({
  default: {
    Socket: vi.fn(function (this: EventEmitter) {
      const ee = new EventEmitter()
      ;(ee as unknown as Record<string, unknown>).connect = vi.fn(function (
        this: EventEmitter,
        _port: number,
        _host: string,
        cb: () => void
      ) {
        cb()
        return this
      })
      ;(ee as unknown as Record<string, unknown>).write = vi.fn()
      ;(ee as unknown as Record<string, unknown>).setTimeout = vi.fn()
      ;(ee as unknown as Record<string, unknown>).destroy = vi.fn()
      mockSockets.push(ee)
      return ee
    }),
  },
}))

describe('server service', () => {
  beforeEach(() => {
    vi.resetModules()
    mockSockets.length = 0
    process.env.SERVER_HOST = 'play.arcend.mc'
    process.env.SERVER_PORT = '25565'
  })

  it('returns online status with player counts', async () => {
    const { getServerStatus } = await import('./server')
    const promise = getServerStatus()

    mockSockets[0].emit('data', buildStatusResponse(12, 50))

    const result = await promise
    expect(result).toEqual({ online: true, playersOnline: 12, playersMax: 50 })
  })

  it('handles chunked data correctly', async () => {
    const { getServerStatus } = await import('./server')
    const promise = getServerStatus()

    const response = buildStatusResponse(7, 50)
    const half = Math.floor(response.length / 2)

    mockSockets[0].emit('data', response.subarray(0, half))
    mockSockets[0].emit('data', response.subarray(half))

    const result = await promise
    expect(result).toEqual({ online: true, playersOnline: 7, playersMax: 50 })
  })

  it('returns offline when socket emits error', async () => {
    const { getServerStatus } = await import('./server')
    const promise = getServerStatus()

    mockSockets[0].emit('error', new Error('ECONNREFUSED'))

    const result = await promise
    expect(result).toEqual({ online: false, playersOnline: 0, playersMax: 0 })
  })

  it('returns offline when socket closes before data', async () => {
    const { getServerStatus } = await import('./server')
    const promise = getServerStatus()

    mockSockets[0].emit('close')

    const result = await promise
    expect(result).toEqual({ online: false, playersOnline: 0, playersMax: 0 })
  })

  it('returns offline on timeout', async () => {
    vi.useFakeTimers()
    const { getServerStatus } = await import('./server')
    const promise = getServerStatus()

    vi.advanceTimersByTime(5001)

    const result = await promise
    expect(result).toEqual({ online: false, playersOnline: 0, playersMax: 0 })
    vi.useRealTimers()
  })

  it('uses default port 25565 when SERVER_PORT is unset', async () => {
    delete process.env.SERVER_PORT
    const { getServerStatus } = await import('./server')
    const promise = getServerStatus()

    mockSockets[0].emit('data', buildStatusResponse(0, 20))

    await promise
    expect((mockSockets[0] as unknown as { connect: vi.Mock }).connect).toHaveBeenCalledWith(
      25565,
      'play.arcend.mc',
      expect.any(Function)
    )
  })

  it('throws when SERVER_HOST is not defined', async () => {
    delete process.env.SERVER_HOST
    const { getServerStatus } = await import('./server')
    await expect(getServerStatus()).rejects.toThrow('SERVER_HOST')
  })
})
