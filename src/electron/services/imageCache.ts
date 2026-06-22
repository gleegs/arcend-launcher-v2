import { protocol, net } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { imagesCacheDir } from '../lib/paths'

// Cache disque des images distantes (covers d'arc, vignettes, logos…), servies
// au renderer via le protocole `arcend-img://`.
//
// Stratégie « stale-while-revalidate » :
//  - 1er affichage : téléchargement puis écriture sur disque (puis service).
//  - lancements suivants : service immédiat depuis le disque (instantané,
//    dispo hors-ligne) ET re-téléchargement en arrière-plan pour rafraîchir le
//    fichier si l'image a changé côté serveur (même URL, contenu différent).
//    La nouvelle version apparaît alors au lancement suivant.

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

function cachePathFor(targetUrl: string): string {
  const key = crypto.createHash('sha1').update(targetUrl).digest('hex')
  return path.join(imagesCacheDir, key)
}

function ensureCacheDir(): void {
  if (!fs.existsSync(imagesCacheDir)) {
    fs.mkdirSync(imagesCacheDir, { recursive: true })
  }
}

// Télécharge l'image et l'écrit sur disque si elle a changé. Renvoie true si le
// fichier sur disque est désormais à jour.
async function download(targetUrl: string, dest: string): Promise<boolean> {
  const response = await fetch(targetUrl)
  if (!response.ok) return false
  const buffer = Buffer.from(await response.arrayBuffer())
  let changed = true
  try {
    changed = !fs.readFileSync(dest).equals(buffer)
  } catch {
    // Pas encore en cache.
  }
  if (changed) {
    ensureCacheDir()
    fs.writeFileSync(dest, buffer)
  }
  return true
}

// Évite de revalider plusieurs fois la même URL en parallèle.
const revalidating = new Set<string>()

function revalidateInBackground(targetUrl: string, dest: string): void {
  if (revalidating.has(targetUrl)) return
  revalidating.add(targetUrl)
  download(targetUrl, dest)
    .catch(() => undefined)
    .finally(() => revalidating.delete(targetUrl))
}

export function registerImageProtocol(): void {
  protocol.handle(IMAGE_PROTOCOL, async (request) => {
    const targetUrl = new URL(request.url).searchParams.get('u')
    if (!targetUrl) return new Response('missing url', { status: 400 })

    ensureCacheDir()
    const dest = cachePathFor(targetUrl)
    const headers = { 'Content-Type': guessMime(targetUrl), 'Cache-Control': 'no-store' }

    // Déjà en cache : service immédiat + rafraîchissement en arrière-plan.
    if (fs.existsSync(dest)) {
      revalidateInBackground(targetUrl, dest)
      const data = await fs.promises.readFile(dest)
      return new Response(data, { headers })
    }

    // Pas en cache : téléchargement synchrone.
    try {
      if (await download(targetUrl, dest)) {
        const data = await fs.promises.readFile(dest)
        return new Response(data, { headers })
      }
    } catch {
      // Réseau indisponible : on tente le distant ci-dessous.
    }

    return net.fetch(targetUrl)
  })
}
