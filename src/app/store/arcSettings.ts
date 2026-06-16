import { create } from 'zustand'
import type { ArcSettings } from '../../electron/types/ipc'

export const DEFAULT_MAX_MEMORY = 8

interface ArcSettingsState {
  settingsByArc: Record<string, ArcSettings>
  isArcSettingsOpen: boolean
  setIsArcSettingsOpen: (open: boolean) => void
  toggleArcSettings: () => void
  initArcSettings: () => Promise<void>
  getArcSettings: (arcId: string) => ArcSettings
  setArcMemory: (arcId: string, gb: number) => Promise<void>
}

export const useArcSettingsStore = create<ArcSettingsState>((set, get) => ({
  settingsByArc: {},
  isArcSettingsOpen: false,
  setIsArcSettingsOpen: (open) => set({ isArcSettingsOpen: open }),
  toggleArcSettings: () => set((s) => ({ isArcSettingsOpen: !s.isArcSettingsOpen })),
  initArcSettings: async () => {
    const result = await window.electronAPI.storeGet('arcSettings')
    if (result.ok && result.data) {
      set({ settingsByArc: result.data })
    }
  },
  getArcSettings: (arcId) => {
    const stored = get().settingsByArc[arcId]
    return stored ?? { maxMemory: DEFAULT_MAX_MEMORY }
  },
  setArcMemory: async (arcId, gb) => {
    const updated = { ...get().settingsByArc, [arcId]: { maxMemory: gb } }
    set({ settingsByArc: updated })
    await window.electronAPI.storeSet('arcSettings', updated)
  },
}))
