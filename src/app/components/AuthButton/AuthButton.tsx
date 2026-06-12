import { useEffect } from 'react'
import LoginIcon from '../../assets/icon/login-icon.svg?react'
import LogoutIcon from '../../assets/icon/logout-icon.svg?react'
import Button from '../Button/Button'
import { useAuthStore } from '../../store/auth'

export default function AuthButton() {
  const state = useAuthStore((s) => s.state)
  const isLoading = useAuthStore((s) => s.isLoading)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  if (state.status !== 'unauthenticated') {
    const profile = state.profile
    return (
      <Button
        className="group flex justify-center items-center gap-2 min-w-48 relative hover:border-red-500/70! hover:border-2"
        onClick={logout}
      >
        <div className="flex items-center gap-2 transition-opacity duration-200 group-hover:opacity-0">
          <img
            src={`https://mc-heads.net/avatar/${profile.id}`}
            alt={profile.name}
            className="w-5 h-5 rounded-sm"
          />
          <span className="uppercase font-black text-xs">{profile.name}</span>
        </div>
        <div className="absolute inset-0 flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <LogoutIcon className="text-white" />
          <span className="uppercase font-black text-xs">Se déconnecter ?</span>
        </div>
      </Button>
    )
  }

  return (
    <Button
      className="flex justify-center items-center gap-2 min-w-48"
      disabled={isLoading}
      onClick={login}
    >
      <span className="uppercase font-black text-xs">Se connecter</span>
      <LoginIcon className="text-white" />
    </Button>
  )
}
