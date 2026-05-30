export interface PackwizInstallation {
  version: string
  jarPath: string
  installedAt: string
}

export interface PackwizRegistry {
  installation: PackwizInstallation | null
}

export interface PackwizInstallProgress {
  percent: number
  status: 'downloading' | 'done'
}
