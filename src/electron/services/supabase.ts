import { createClient, SupabaseClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import { remoteArcsCachePath, cacheDir } from '../lib/paths'
import { isActiveArc } from '../types/arc'
import type { RemoteArc } from '../types/arc'

let client: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL et SUPABASE_PUBLISHABLE_KEY doivent être définis dans .env')
  }

  client = createClient(url, key)
  return client
}

export function getCoverUrl(coverImage: string | null): string | undefined {
  if (!coverImage) return undefined
  const url = process.env.SUPABASE_URL
  if (!url) return coverImage
  return `${url}/storage/v1/object/public/arc-covers/${coverImage}`
}

async function fetchArcsFromApi(): Promise<RemoteArc[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('arcs')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    throw new Error(`Supabase fetch error: ${error.message}`)
  }

  return (data ?? []) as RemoteArc[]
}

function readCache(): RemoteArc[] | null {
  try {
    if (!fs.existsSync(remoteArcsCachePath)) return null
    const raw = fs.readFileSync(remoteArcsCachePath, 'utf-8')
    return JSON.parse(raw) as RemoteArc[]
  } catch {
    return null
  }
}

function writeCache(arcs: RemoteArc[]): void {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }
  fs.writeFileSync(remoteArcsCachePath, JSON.stringify(arcs, null, 2), 'utf-8')
}

export async function fetchArcsWithCache(): Promise<RemoteArc[]> {
  try {
    const arcs = await fetchArcsFromApi()
    writeCache(arcs)
    return arcs
  } catch {
    const cached = readCache()
    return cached ?? []
  }
}

export async function fetchActiveArc(): Promise<RemoteArc | null> {
  const arcs = await fetchArcsWithCache()
  return arcs.find(isActiveArc) ?? null
}
