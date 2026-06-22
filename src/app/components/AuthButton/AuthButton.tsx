import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { LogIn, LogOut } from 'lucide-react'
import Button from '../Button/Button'
import { useAuthStore } from '../../store/auth'

export default function AuthButton() {
  const state = useAuthStore((s) => s.state)
  const isLoading = useAuthStore((s) => s.isLoading)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const init = useAuthStore((s) => s.init)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    init()
  }, [init])

  if (state.status !== 'unauthenticated') {
    const profile = state.profile
    const handleClick = () => {
      if (confirmLogout) {
        logout()
      } else {
        setConfirmLogout(true)
      }
    }
    return (
      <Button
        className={clsx(
          'flex justify-center items-center gap-2 min-w-48 relative',
          confirmLogout && 'border-red-500/70! border-2'
        )}
        onClick={handleClick}
        onMouseLeave={() => setConfirmLogout(false)}
      >
        <div
          className={clsx(
            'flex items-center gap-2 transition-opacity duration-200',
            confirmLogout && 'opacity-0'
          )}
        >
          <img
            src={`https://mc-heads.net/avatar/${profile.id}`}
            alt={profile.name}
            className="w-5 h-5 rounded-sm"
          />
          <span className="uppercase font-black text-xs">{profile.name}</span>
        </div>
        <div
          className={clsx(
            'absolute inset-0 flex justify-center items-center gap-2 transition-opacity duration-200',
            confirmLogout ? 'opacity-100' : 'opacity-0'
          )}
        >
          <LogOut className="text-white" />
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
      <LogIn className="text-white" />
    </Button>
  )
}
