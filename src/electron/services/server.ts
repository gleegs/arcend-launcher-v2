import net from 'node:net'
import type { ServerStatus } from '../types/server'

const DEFAULT_PORT = 25565
const TIMEOUT_MS = 5000

function writeVarInt(value: number): Buffer {
  const bytes: number[] = []
  let v = value
  while ((v & ~0x7f) !== 0) {
    bytes.push((v & 0x7f) | 0x80)
    v >>>= 7
  }
  bytes.push(v & 0x7f)
  return Buffer.from(bytes)
}

function readVarInt(buf: Buffer, offset: number): [value: number, bytesRead: number] {
  let result = 0
  let numRead = 0
  let read: number

  do {
    if (offset + numRead >= buf.length) throw new Error('insufficient data')
    read = buf.readUInt8(offset + numRead)
    result |= (read & 0x7f) << (7 * numRead)
    numRead++
    if (numRead > 5) throw new Error('VarInt too big')
  } while ((read & 0x80) !== 0)

  return [result, numRead]
}

function buildHandshake(host: string, port: number): Buffer {
  const protocolVersion = writeVarInt(-1)
  const addr = Buffer.from(host, 'utf8')
  const addrLen = writeVarInt(addr.length)
  const portBuf = Buffer.alloc(2)
  portBuf.writeUInt16BE(port)
  const nextState = writeVarInt(1)

  const payload = Buffer.concat([
    writeVarInt(0x00),
    protocolVersion,
    addrLen,
    addr,
    portBuf,
    nextState,
  ])
  return Buffer.concat([writeVarInt(payload.length), payload])
}

function buildRequest(): Buffer {
  const payload = writeVarInt(0x00)
  return Buffer.concat([writeVarInt(payload.length), payload])
}

function parseStatusResponse(data: Buffer): { online: number; max: number } {
  let offset = 0

  const [packetLength, packetLenBytes] = readVarInt(data, offset)
  offset += packetLenBytes

  if (data.length < offset + packetLength) throw new Error('incomplete packet')

  const [packetId, packetIdBytes] = readVarInt(data, offset)
  offset += packetIdBytes

  if (packetId !== 0x00) throw new Error(`unexpected packet id: ${packetId}`)

  const [jsonLength, jsonLenBytes] = readVarInt(data, offset)
  offset += jsonLenBytes

  const json = JSON.parse(data.subarray(offset, offset + jsonLength).toString('utf8'))
  return { online: json.players.online, max: json.players.max }
}

export async function getServerStatus(): Promise<ServerStatus> {
  const host = process.env.SERVER_HOST
  const port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : DEFAULT_PORT

  if (!host) {
    throw new Error('SERVER_HOST doit être défini dans .env')
  }

  console.log(`[server] Pinging ${host}:${port}...`)

  return new Promise<ServerStatus>((resolve) => {
    const socket = new net.Socket()
    let buffer = Buffer.alloc(0)
    let settled = false

    const finish = (status: ServerStatus) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.removeAllListeners()
      socket.destroy()
      console.log(`[server] Result:`, status)
      resolve(status)
    }

    const timer = setTimeout(() => {
      console.log(`[server] Timeout after ${TIMEOUT_MS}ms`)
      finish({ online: false, playersOnline: 0, playersMax: 0 })
    }, TIMEOUT_MS)

    socket.on('error', (err) => {
      console.log(`[server] Socket error: ${err.message}`)
      finish({ online: false, playersOnline: 0, playersMax: 0 })
    })
    socket.on('close', () => {
      console.log('[server] Socket closed')
      finish({ online: false, playersOnline: 0, playersMax: 0 })
    })
    socket.on('timeout', () => {
      console.log('[server] Socket idle timeout')
      finish({ online: false, playersOnline: 0, playersMax: 0 })
    })

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk])
      console.log(`[server] Received ${chunk.length} bytes (total buffer: ${buffer.length})`)
      try {
        const { online, max } = parseStatusResponse(buffer)
        finish({ online: true, playersOnline: online, playersMax: max })
      } catch (e) {
        console.log(`[server] Waiting for more data... (${(e as Error).message})`)
      }
    })

    socket.setTimeout(TIMEOUT_MS)
    socket.connect(port, host, () => {
      console.log(`[server] Connected to ${host}:${port}, sending handshake + request...`)
      socket.write(buildHandshake(host, port))
      socket.write(buildRequest())
    })
  })
}
