export interface ArcMetadata {
  arcId: string
  name: string
  version: string
  packwizUrl: string
  description?: string
  cover?: string
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
