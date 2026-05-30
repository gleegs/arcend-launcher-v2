export interface JavaInstallation {
  version: string
  path: string
  installedAt: string
  arch: string
}

export interface JavaRegistry {
  installations: Record<string, JavaInstallation>
}

export type JavaInstallStatus = 'downloading' | 'extracting' | 'done'

export interface JavaInstallProgress {
  version: string
  percent: number
  status: JavaInstallStatus
}
