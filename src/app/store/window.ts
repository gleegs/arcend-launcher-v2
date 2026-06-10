import { create } from 'zustand'

interface WindowStore {
  isHiding: boolean
  setIsHiding: (value: boolean) => void
  minimize: () => void
  close: () => void
}

export const useWindowStore = create<WindowStore>((set) => ({
  isHiding: false,
  setIsHiding: (value) => set({ isHiding: value }),
  minimize: () => {
    set({ isHiding: true })
    setTimeout(() => window.electronAPI.windowMinimize(), 200)
  },
  close: () => {
    set({ isHiding: true })
    setTimeout(() => window.electronAPI.windowClose(), 200)
  },
}))
