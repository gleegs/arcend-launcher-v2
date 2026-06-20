import { create } from 'zustand'

type RemoteArc = Awaited<ReturnType<typeof window.electronAPI.arcFetchRemote>>['data'] extends
  | (infer T)[]
  | undefined
  ? T
  : never

export interface ArcItem extends RemoteArc {
  installed: boolean
}

interface ArcStore {
  arcs: ArcItem[]
  setArcs: (arcs: ArcItem[]) => void
  selectedArc: ArcItem | null
  selectArc: (arc: ArcItem | null) => void
  setArcInstalled: (arcId: string, installed: boolean) => void
  uninstallArc: (arcId: string) => Promise<boolean>
}

export const useArcStore = create<ArcStore>((set, get) => ({
  arcs: [],
  setArcs: (arcs) => set({ arcs }),
  selectedArc: null,
  selectArc: (arc) => set({ selectedArc: arc }),
  setArcInstalled: (arcId, installed) =>
    set((state) => ({
      arcs: state.arcs.map((arc) => (arc.slug === arcId ? { ...arc, installed } : arc)),
      selectedArc:
        state.selectedArc && state.selectedArc.slug === arcId
          ? { ...state.selectedArc, installed }
          : state.selectedArc,
    })),
  uninstallArc: async (arcId) => {
    const result = await window.electronAPI.arcUninstall(arcId)
    if (result.ok) {
      get().setArcInstalled(arcId, false)
      return true
    }
    return false
  },
}))
