import { useEffect, useState } from 'react'
import { useUpdaterStore } from '../../store/updater'
import Button from '../Button/Button'
import DownloadIcon from '../../assets/icon/download.svg?react'
import CrossIcon from '../../assets/icon/cross-icon.svg?react'

export default function UpdateToast() {
  const updateReady = useUpdaterStore((s) => s.updateReady)
  const version = useUpdaterStore((s) => s.version)
  const initUpdater = useUpdaterStore((s) => s.initUpdater)
  const installUpdate = useUpdaterStore((s) => s.installUpdate)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    initUpdater()
  }, [initUpdater])

  if (!updateReady || dismissed) return null

  const handleInstall = () => {
    installUpdate().catch(() => undefined)
  }

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl bg-black border border-border px-5 py-3 shadow-glass-lg"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <DownloadIcon width={20} height={20} className="text-white shrink-0" />
      <div className="flex flex-col">
        <span className="text-sm font-black uppercase">
          Mise à jour prête{version ? ` — ${version}` : ''}
        </span>
        <span className="text-xs text-white/50">Elle sera installée au prochain redémarrage.</span>
      </div>
      <Button
        onClick={handleInstall}
        className="text-black bg-white text-xs uppercase font-black px-4 py-1.5"
      >
        Redémarrer
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/40 hover:text-white transition-colors duration-250 shrink-0"
        style={{ WebkitAppRegion: 'no-drag' }}
        aria-label="Fermer"
      >
        <CrossIcon width={16} height={16} />
      </button>
    </div>
  )
}
