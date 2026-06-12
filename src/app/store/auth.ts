import { create } from 'zustand'

interface CachedProfile {
  id: string
  name: string
}

type AuthState =
  | { status: 'online'; profile: CachedProfile }
  | { status: 'offline'; profile: CachedProfile }
  | { status: 'unauthenticated' }

interface AuthStore {
  state: AuthState
  isLoading: boolean
  init: () => Promise<void>
  login: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  state: { status: 'unauthenticated' },
  isLoading: false,

  init: async () => {
    const result = await window.electronAPI.authGetState()
    if (result.ok && result.data) {
      set({ state: result.data })
    }
  },

  login: async () => {
    set({ isLoading: true })
    const result = await window.electronAPI.authLogin()
    if (result.ok && result.data) {
      set({ state: result.data, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    await window.electronAPI.authLogout()
    set({ state: { status: 'unauthenticated' } })
  },
}))
