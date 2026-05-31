import { safeStorage } from 'electron'
import { Auth } from 'msmc'
import { getConfig, setConfig } from './store'
import { getMainWindow } from './window'
import type { AuthState, CachedProfile } from '../types/ipc'

export const auth = new Auth('login')

function encryptToken(plainToken: string): string {
  const encrypted = safeStorage.encryptString(plainToken)
  return encrypted.toString('base64')
}

export function decryptToken(encryptedBase64: string): string | null {
  try {
    const buffer = Buffer.from(encryptedBase64, 'base64')
    return safeStorage.decryptString(buffer)
  } catch {
    return null
  }
}

function saveSession(refreshToken: string, profile: CachedProfile): void {
  if (safeStorage.isEncryptionAvailable()) {
    setConfig('encryptedRefreshToken', encryptToken(refreshToken))
  }
  setConfig('cachedProfile', profile)
}

function clearSession(): void {
  setConfig('encryptedRefreshToken', undefined)
  setConfig('cachedProfile', undefined)
}

export async function login(): Promise<AuthState> {
  const mainWindow = getMainWindow()

  const xbox = await auth.launch('electron', {
    width: 500,
    height: 650,
    parent: mainWindow ?? undefined,
  })

  const minecraft = await xbox.getMinecraft()
  if (!minecraft.profile) {
    throw new Error('No Minecraft profile found')
  }

  const profile: CachedProfile = {
    id: minecraft.profile.id,
    name: minecraft.profile.name,
  }

  saveSession(xbox.save(), profile)

  return { status: 'online', profile }
}

export async function refresh(): Promise<AuthState> {
  const cached = getConfig('cachedProfile')
  const encryptedToken = getConfig('encryptedRefreshToken')

  if (!encryptedToken || !safeStorage.isEncryptionAvailable()) {
    if (cached) return { status: 'offline', profile: cached }
    return { status: 'unauthenticated' }
  }

  const refreshToken = decryptToken(encryptedToken)
  if (!refreshToken) {
    if (cached) return { status: 'offline', profile: cached }
    return { status: 'unauthenticated' }
  }

  try {
    const xbox = await auth.refresh(refreshToken)
    const minecraft = await xbox.getMinecraft()
    if (!minecraft.profile) {
      if (cached) return { status: 'offline', profile: cached }
      return { status: 'unauthenticated' }
    }

    const profile: CachedProfile = {
      id: minecraft.profile.id,
      name: minecraft.profile.name,
    }

    saveSession(xbox.save(), profile)

    return { status: 'online', profile }
  } catch {
    if (cached) return { status: 'offline', profile: cached }
    return { status: 'unauthenticated' }
  }
}

export async function logout(): Promise<void> {
  clearSession()
}

export function getAuthState(): AuthState {
  const cached = getConfig('cachedProfile')
  const encryptedToken = getConfig('encryptedRefreshToken')

  if (encryptedToken && safeStorage.isEncryptionAvailable()) {
    const refreshToken = decryptToken(encryptedToken)
    if (refreshToken && cached) {
      return { status: 'online', profile: cached }
    }
  }

  if (cached) {
    return { status: 'offline', profile: cached }
  }

  return { status: 'unauthenticated' }
}
