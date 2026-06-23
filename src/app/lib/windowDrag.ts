import type { MouseEvent as ReactMouseEvent } from 'react'

// Déplacement custom de la fenêtre. Remplace `-webkit-app-region: drag`, qui
// fonctionne bien mais force le curseur système (impossible d'appliquer un
// curseur personnalisé sur une zone draggable). On démarre le drag au
// mousedown sur le fond, en ignorant les contrôles marqués `no-drag` (ou les
// éléments interactifs natifs).
const IGNORE_SELECTOR = '[style*="no-drag"], button, a, input, select, textarea, [role="button"]'

export async function startWindowDrag(e: ReactMouseEvent): Promise<void> {
  if (e.button !== 0) return
  if ((e.target as HTMLElement).closest(IGNORE_SELECTOR)) return

  // Empêche la sélection / le drag natif de l'image de fond pendant le déplacement.
  e.preventDefault()

  const res = await window.electronAPI.windowGetPosition()
  if (!res.ok || !res.data) return

  const offsetX = e.screenX - res.data.x
  const offsetY = e.screenY - res.data.y

  let raf = 0
  let nextX = res.data.x
  let nextY = res.data.y

  const onMove = (ev: MouseEvent) => {
    nextX = ev.screenX - offsetX
    nextY = ev.screenY - offsetY
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = 0
        window.electronAPI.windowMove(nextX, nextY)
      })
    }
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    if (raf) cancelAnimationFrame(raf)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
