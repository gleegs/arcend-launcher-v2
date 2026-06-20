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

export type LogLevel = 'info' | 'warn' | 'error'

export type LogSource = 'game' | 'launcher'

export interface LogEntry {
  id: number
  timestamp: number
  level: LogLevel
  message: string
  source: LogSource
}

export interface LaunchOptions {
  arcId: string
  mode: 'online' | 'offline'
  maxMemory?: string
  minMemory?: string
}
