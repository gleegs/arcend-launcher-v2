import { create } from 'zustand'

type RemoteArc = Awaited<ReturnType<typeof window.electronAPI.arcFetchRemote>>['data'] extends
  | (infer T)[]
  | undefined
  ? T
  : never

export interface ArcItem extends RemoteArc {
  installed: boolean
}

/**
 * Picks the cover that matches the current time of day.
 *
 * Covers are matched by keyword found in their URL (e.g. `..._sunset.jpg`),
 * so the choice is resilient to the order of `coverUrl` in the backend.
 * Falls back to index 0 when no matching cover is found.
 */
export function coverIndexForTime(covers: string[] | null | undefined, now = new Date()): number {
  if (!covers || covers.length === 0) return 0

  const hour = now.getHours()
  let keywords: string[]
  if (hour >= 8 && hour < 18) {
    keywords = ['day', 'noon']
  } else if (hour >= 18 && hour < 20) {
    keywords = ['sunset', 'dusk', 'sunrise', 'dawn']
  } else {
    keywords = ['night', 'midnight']
  }

  const index = covers.findIndex((url) => {
    const name = url.toLowerCase()
    return keywords.some((keyword) => name.includes(keyword))
  })

  return index === -1 ? 0 : index
}

interface ArcStore {
  arcs: ArcItem[]
  setArcs: (arcs: ArcItem[]) => void
  selectedArc: ArcItem | null
  selectArc: (arc: ArcItem | null) => void
  coverIndex: number
  /** Last cover index applied automatically from the time of day. */
  autoCoverIndex: number
  cycleCover: () => void
  refreshCoverForTime: () => void
  setArcInstalled: (arcId: string, installed: boolean) => void
  uninstallArc: (arcId: string) => Promise<boolean>
}

export const useArcStore = create<ArcStore>((set, get) => ({
  arcs: [],
  setArcs: (arcs) => set({ arcs }),
  selectedArc: null,
  selectArc: (arc) => {
    const index = coverIndexForTime(arc?.coverUrl)
    set({ selectedArc: arc, coverIndex: index, autoCoverIndex: index })
  },
  coverIndex: 0,
  autoCoverIndex: 0,
  cycleCover: () =>
    set((state) => {
      const covers = state.selectedArc?.coverUrl
      const len = covers?.length ?? 1
      return { coverIndex: (state.coverIndex + 1) % len }
    }),
  refreshCoverForTime: () =>
    set((state) => {
      const next = coverIndexForTime(state.selectedArc?.coverUrl)
      // Only switch when the time slot changed since the last auto update,
      // so a manual cycle (logo click) is preserved until the next boundary.
      return next === state.autoCoverIndex ? {} : { coverIndex: next, autoCoverIndex: next }
    }),
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
