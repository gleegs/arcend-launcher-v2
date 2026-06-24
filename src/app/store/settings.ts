import { create } from 'zustand'

interface SettingsState {
  isSettingsOpen: boolean
  setIsSettingsOpen: (open: boolean) => void
  toggleSettings: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isSettingsOpen: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  toggleSettings: () => set((s) => ({ isSettingsOpen: !s.isSettingsOpen })),
}))
