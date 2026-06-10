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
  selectedArc: ArcItem | null
  selectArc: (arc: ArcItem | null) => void
}

export const useArcStore = create<ArcStore>((set) => ({
  selectedArc: null,
  selectArc: (arc) => set({ selectedArc: arc }),
}))
