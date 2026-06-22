import { protocol, net } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { imagesCacheDir } from '../lib/paths'

// Cache disque des images distantes (covers d'arc, vignettes…), servies au
// renderer via le protocole `arcend-img://`. Au premier affichage l'image est
// téléchargée puis écrite sur disque ; aux lancements suivants elle est servie
// localement (instantané, et disponible hors-ligne).

export const IMAGE_PROTOCOL = 'arcend-img'

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
}

function guessMime(targetUrl: string): string {
  try {
    const ext = path.extname(new URL(targetUrl).pathname).toLowerCase()
    return MIME_BY_EXT[ext] ?? 'image/jpeg'
  } catch {
    return 'image/jpeg'
  }
}

async function ensureCached(targetUrl: string): Promise<string | null> {
  try {
    if (!fs.existsSync(imagesCacheDir)) {
      fs.mkdirSync(imagesCacheDir, { recursive: true })
    }
    const key = crypto.createHash('sha1').update(targetUrl).digest('hex')
    const dest = path.join(imagesCacheDir, key)
    if (fs.existsSync(dest)) return dest

    const response = await fetch(targetUrl)
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(dest, buffer)
    return dest
  } catch {
    return null
  }
}

export function registerImageProtocol(): void {
  protocol.handle(IMAGE_PROTOCOL, async (request) => {
    const targetUrl = new URL(request.url).searchParams.get('u')
    if (!targetUrl) return new Response('missing url', { status: 400 })

    const localPath = await ensureCached(targetUrl)
    if (localPath) {
      const data = await fs.promises.readFile(localPath)
      return new Response(data, { headers: { 'Content-Type': guessMime(targetUrl) } })
    }

    // Échec du cache (réseau indisponible et rien en cache) : on tente de
    // servir l'image distante directement.
    return net.fetch(targetUrl)
  })
}
