import { create } from 'zustand'
import type { LogEntry, LogLevel } from '../../electron/types/launcher'

const MAX_LOGS = 500

const ALL_LEVELS: LogLevel[] = ['info', 'warn', 'error']

interface LogState {
  logs: LogEntry[]
  filters: LogLevel[]
  _initialized: boolean
  init: () => void
  /** Ajoute une entrée de log générée côté launcher (ex. progression d'install). */
  add: (message: string, level?: LogLevel) => void
  toggleFilter: (level: LogLevel) => void
  clear: () => void
}

// Ids décroissants pour les logs locaux, afin de ne pas entrer en collision
// avec les ids (croissants) émis par le process principal.
let localLogId = -1

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  filters: [...ALL_LEVELS],
  _initialized: false,
  init: () => {
    if (get()._initialized) return
    set({ _initialized: true })

    window.electronAPI.onLog((entry) => {
      set((state) => {
        const logs = [...state.logs, entry]
        if (logs.length > MAX_LOGS) {
          logs.splice(0, logs.length - MAX_LOGS)
        }
        return { logs }
      })
    })
  },
  add: (message, level = 'info') =>
    set((state) => {
      const entry: LogEntry = {
        id: localLogId--,
        timestamp: Date.now(),
        level,
        message,
        source: 'launcher',
      }
      const logs = [...state.logs, entry]
      if (logs.length > MAX_LOGS) {
        logs.splice(0, logs.length - MAX_LOGS)
      }
      return { logs }
    }),
  toggleFilter: (level) =>
    set((state) => {
      const has = state.filters.includes(level)
      const filters = has ? state.filters.filter((l) => l !== level) : [...state.filters, level]
      return { filters: filters.length === 0 ? [...ALL_LEVELS] : filters }
    }),
  clear: () => set({ logs: [] }),
}))
