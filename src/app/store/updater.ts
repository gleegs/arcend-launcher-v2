import { create } from 'zustand'
import type { UpdateDownloadedInfo } from '../../electron/types/updater'

interface UpdaterState {
  updateReady: boolean
  version: string | null
  initUpdater: () => void
  setUpdateDownloaded: (info: UpdateDownloadedInfo) => void
  installUpdate: () => Promise<void>
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
  updateReady: false,
  version: null,
  initUpdater: () => {
    window.electronAPI.onUpdateDownloaded((info) => {
      set({ updateReady: true, version: info.version })
    })
  },
  setUpdateDownloaded: (info) => {
    set({ updateReady: true, version: info.version })
  },
  installUpdate: async () => {
    await window.electronAPI.updaterInstall()
  },
}))
