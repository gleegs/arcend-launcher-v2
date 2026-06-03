export interface RemoteArc {
  slug: string
  name: string | null
  description: string | null
  version: string | null
  startDate: string | null
  endDate: string | null
  mcVersion: string | null
  javaVersion: string | null
  loader: string | null
  loaderVersion: string | null
  loaderInstallUrl: string | null
  modpackUrl: string | null
  coverImage: string | null
  createdAt: string
}

export interface ArcModLoader {
  type: string
  version: string
  installerUrl: string
}

export interface ArcMetadata {
  arcId: string
  name: string
  version: string
  packwizUrl: string
  mcVersion: string
  javaVersion: string
  modLoader?: ArcModLoader
  description?: string
  cover?: string
}

export function remoteArcToMetadata(arc: RemoteArc, coverUrl?: string): ArcMetadata {
  return {
    arcId: arc.slug,
    name: arc.name ?? '',
    version: arc.version ?? '',
    packwizUrl: arc.modpackUrl ?? '',
    mcVersion: arc.mcVersion ?? '',
    javaVersion: arc.javaVersion ?? '21',
    modLoader:
      arc.loader && arc.loaderVersion && arc.loaderInstallUrl
        ? { type: arc.loader, version: arc.loaderVersion, installerUrl: arc.loaderInstallUrl }
        : undefined,
    description: arc.description ?? undefined,
    cover: coverUrl ?? arc.coverImage ?? undefined,
  }
}

export function isActiveArc(arc: RemoteArc): boolean {
  if (!arc.startDate) return false
  const now = new Date()
  const start = new Date(arc.startDate)
  if (now < start) return false
  if (!arc.endDate) return true
  return now <= new Date(arc.endDate)
}

export interface ArcInstallation {
  arcId: string
  path: string
  installedAt: string
  metadata: ArcMetadata
  size: number
}

export interface ArcRegistry {
  installations: Record<string, ArcInstallation>
}

export type ArcInstallStatus =
  | 'creating_folder'
  | 'syncing_packwiz'
  | 'creating_metadata'
  | 'done'
  | 'error'

export interface ArcInstallProgress {
  arcId: string
  percent: number
  status: ArcInstallStatus
  error?: string
}
