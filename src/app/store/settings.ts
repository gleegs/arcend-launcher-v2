import { create } from 'zustand'

interface SettingsState {
  isSettingsOpen: boolean
  showConsole: boolean
  setIsSettingsOpen: (open: boolean) => void
  toggleSettings: () => void
  initShowConsole: () => Promise<void>
  setShowConsole: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isSettingsOpen: false,
  showConsole: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  toggleSettings: () => set((s) => ({ isSettingsOpen: !s.isSettingsOpen })),
  initShowConsole: async () => {
    const result = await window.electronAPI.storeGet('showConsole')
    if (result.ok && result.data !== undefined) {
      set({ showConsole: result.data })
    }
  },
  setShowConsole: async (value) => {
    set({ showConsole: value })
    await window.electronAPI.storeSet('showConsole', value)
  },
}))
