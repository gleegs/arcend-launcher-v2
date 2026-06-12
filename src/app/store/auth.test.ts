import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from './auth'
import type { AuthState } from './auth'

const fakeProfile = { id: 'uuid-123', name: 'Player1' }

const mockAuthGetState = vi.fn()
const mockAuthLogin = vi.fn()
const mockAuthLogout = vi.fn()

const originalWindow = globalThis.window

beforeEach(() => {
  vi.resetModules()
  globalThis.window = {
    electronAPI: {
      authGetState: (...args: unknown[]) => mockAuthGetState(...args),
      authLogin: (...args: unknown[]) => mockAuthLogin(...args),
      authLogout: (...args: unknown[]) => mockAuthLogout(...args),
    },
  } as unknown as Window & typeof globalThis
  useAuthStore.setState({ state: { status: 'unauthenticated' }, isLoading: false })
  mockAuthGetState.mockReset()
  mockAuthLogin.mockReset()
  mockAuthLogout.mockReset()
})

afterEach(() => {
  globalThis.window = originalWindow
})

describe('useAuthStore', () => {
  describe('init', () => {
    it('sets state to online when authGetState succeeds', async () => {
      const onlineState: AuthState = { status: 'online', profile: fakeProfile }
      mockAuthGetState.mockResolvedValue({ ok: true, data: onlineState })

      await useAuthStore.getState().init()

      expect(useAuthStore.getState().state).toEqual(onlineState)
      expect(mockAuthGetState).toHaveBeenCalledOnce()
    })

    it('keeps unauthenticated when authGetState fails', async () => {
      mockAuthGetState.mockResolvedValue({ ok: false, error: 'fail' })

      await useAuthStore.getState().init()

      expect(useAuthStore.getState().state).toEqual({ status: 'unauthenticated' })
    })
  })

  describe('login', () => {
    it('sets loading then online on success', async () => {
      const onlineState: AuthState = { status: 'online', profile: fakeProfile }
      let loadingDuringCall = false
      mockAuthLogin.mockImplementation(async () => {
        loadingDuringCall = useAuthStore.getState().isLoading
        return { ok: true, data: onlineState }
      })

      await useAuthStore.getState().login()

      expect(loadingDuringCall).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
      expect(useAuthStore.getState().state).toEqual(onlineState)
      expect(mockAuthLogin).toHaveBeenCalledOnce()
    })

    it('resets loading and keeps unauthenticated on failure', async () => {
      mockAuthLogin.mockResolvedValue({ ok: false, error: 'popup closed' })

      await useAuthStore.getState().login()

      expect(useAuthStore.getState().isLoading).toBe(false)
      expect(useAuthStore.getState().state).toEqual({ status: 'unauthenticated' })
    })
  })

  describe('logout', () => {
    it('calls authLogout and resets to unauthenticated', async () => {
      useAuthStore.setState({
        state: { status: 'online', profile: fakeProfile },
      })
      mockAuthLogout.mockResolvedValue({ ok: true })

      await useAuthStore.getState().logout()

      expect(mockAuthLogout).toHaveBeenCalledOnce()
      expect(useAuthStore.getState().state).toEqual({ status: 'unauthenticated' })
    })
  })
})
