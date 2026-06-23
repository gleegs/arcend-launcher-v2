import { useEffect, useRef, useState } from 'react'
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
  const authedAtRef = useRef(0)

  useEffect(() => {
    init()
  }, [init])

  // Mémorise l'instant de connexion pour ignorer le clic d'activation de
  // fenêtre qui survient au retour de la fenêtre Microsoft (sinon le bouton
  // reste bloqué sur « Se déconnecter ? » après le 1er login).
  useEffect(() => {
    if (state.status !== 'unauthenticated') {
      authedAtRef.current = Date.now()
    }
  }, [state.status])

  if (state.status !== 'unauthenticated') {
    const profile = state.profile
    const handleClick = () => {
      // Ignore le clic d'activation de fenêtre juste après la connexion.
      if (Date.now() - authedAtRef.current < 600) return
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
          <span className="uppercase font-black text-xs">{profile.name}</span>
          <img
            src={`https://mc-heads.net/avatar/${profile.id}`}
            alt={profile.name}
            className="w-5 h-5 rounded-sm"
          />
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
