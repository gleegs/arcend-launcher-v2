export type LaunchStatus =
  | 'validating_auth'
  | 'validating_arc'
  | 'preparing_launch'
  | 'launching'
  | 'running'
  | 'closed'
  | 'error'

export interface LaunchProgress {
  status: LaunchStatus
  percent: number
  error?: string
  exitCode?: number | null
}

export interface LaunchOptions {
  arcId: string
  mode: 'online' | 'offline'
  maxMemory?: string
  minMemory?: string
}
