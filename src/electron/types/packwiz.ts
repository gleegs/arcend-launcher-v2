export interface PackwizInstallation {
  version: string
  jarPath: string
  installedAt: string
}

export interface PackwizRegistry {
  installation: PackwizInstallation | null
}

export type PackwizInstallStatus = 'downloading' | 'done'

export interface PackwizInstallProgress {
  percent: number
  status: PackwizInstallStatus
}
