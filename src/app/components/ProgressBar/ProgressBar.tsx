import { useEffect, useRef, useState } from 'react'

/**
 * Interpole `displayPercent` vers `target` via requestAnimationFrame.
 * - Quand la cible monte : animation douce (lerp factor ~0.18, ~250 ms).
 * - Quand la cible descend ou est égale : snap immédiat (pour les resets / erreurs).
 *
 * But : masquer les saccades de la mesure par-entrée-zip de l'extraction Java
 * (la cible peut stagner plusieurs centaines de ms entre deux entrées) tout en
 * restant honnête visuellement.
 */
function useAnimatedPercent(target: number): number {
  const [display, setDisplay] = useState(target)
  const displayRef = useRef(target)
  const targetRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const previousTarget = targetRef.current
    targetRef.current = target

    // Snap immédiat si la cible descend ou ne monte pas (reset, erreur, idle).
    if (target <= previousTarget) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      displayRef.current = target
      setDisplay(target)
      return
    }

    // La cible monte : si une animation est en cours, le tick utilisera la
    // nouvelle cible via targetRef. Sinon on en lance une.
    if (rafRef.current != null) return

    const tick = () => {
      const current = displayRef.current
      const goal = targetRef.current
      const diff = goal - current
      if (diff <= 0.5) {
        displayRef.current = goal
        setDisplay(goal)
        rafRef.current = null
        return
      }
      const next = current + diff * 0.18
      displayRef.current = next
      setDisplay(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [target])

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    },
    []
  )

  return display
}

interface ProgressBarProps {
  /** Pourcentage cible [0, 100]. */
  percent: number
  label: string
  sublabel?: string | null
  error?: string | null
}

export default function ProgressBar({ percent, label, sublabel, error = null }: ProgressBarProps) {
  // En cas d'erreur on fige à 0 (snap via le hook, target <= previousTarget).
  const displayPercent = useAnimatedPercent(error ? 0 : percent)

  return (
    <div
      className="flex flex-col gap-1.5 w-72"
      style={{ WebkitAppRegion: 'no-drag' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between text-xs uppercase font-black ml-5">
        <span
          className={error ? 'truncate' : 'truncate'}
          style={error ? { color: '#dc2626' } : undefined}
          title={error ?? label}
        >
          {error ?? label}
        </span>
        {!error && (
          <span className="text-white/80 tabular-nums shrink-0">{Math.round(displayPercent)}%</span>
        )}
      </div>
      <div className="bg-black p-3 rounded-full translate-x-4">
        <div className="h-2 rounded-full bg-white overflow-hidden mr-2">
          <div
            className="h-full rounded-full ease-out"
            style={{
              width: `${displayPercent}%`,
              backgroundColor: error ? '#dc2626' : 'var(--color-green)',
              transition: 'width 100ms ease-out',
            }}
          />
        </div>
      </div>
      {sublabel && !error && (
        <span className="text-xs text-white/60 tabular-nums ml-5">{sublabel}</span>
      )}
    </div>
  )
}
