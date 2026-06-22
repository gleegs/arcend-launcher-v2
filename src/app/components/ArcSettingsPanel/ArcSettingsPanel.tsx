import { useEffect, useState } from 'react'
import { useArcSettingsStore, DEFAULT_MAX_MEMORY } from '../../store/arcSettings'
import { useArcStore } from '../../store/arc'
import { X, FolderOpen, Trash2 } from 'lucide-react'
import Button from '../Button/Button'
import RamSlider from '../RamSlider/RamSlider'

export default function ArcSettingsPanel() {
  const isArcSettingsOpen = useArcSettingsStore((s) => s.isArcSettingsOpen)
  const setIsArcSettingsOpen = useArcSettingsStore((s) => s.setIsArcSettingsOpen)
  const settingsByArc = useArcSettingsStore((s) => s.settingsByArc)
  const initArcSettings = useArcSettingsStore((s) => s.initArcSettings)
  const setArcMemory = useArcSettingsStore((s) => s.setArcMemory)
  const selectedArc = useArcStore((s) => s.selectedArc)
  const uninstallArc = useArcStore((s) => s.uninstallArc)

  const [confirmUninstall, setConfirmUninstall] = useState(false)
  const [wasOpen, setWasOpen] = useState(isArcSettingsOpen)

  useEffect(() => {
    initArcSettings()
  }, [initArcSettings])

  if (isArcSettingsOpen !== wasOpen) {
    setWasOpen(isArcSettingsOpen)
    setConfirmUninstall(false)
  }

  if (!selectedArc) return null

  const maxMemory = settingsByArc[selectedArc.slug]?.maxMemory ?? DEFAULT_MAX_MEMORY

  const handleMemoryChange = (gb: number) => {
    setArcMemory(selectedArc.slug, gb)
  }

  const handleOpenGameFolder = async () => {
    await window.electronAPI.shellOpenPath(`arcs/${selectedArc.slug}/minecraft`)
  }

  const handleUninstall = async () => {
    if (!confirmUninstall) {
      setConfirmUninstall(true)
      return
    }
    const ok = await uninstallArc(selectedArc.slug)
    if (ok) {
      setIsArcSettingsOpen(false)
    }
    setConfirmUninstall(false)
  }

  return (
    <div
      inert={!isArcSettingsOpen}
      aria-hidden={!isArcSettingsOpen}
      className="absolute top-0 h-full rounded-2xl w-1/2 bg-black p-8 pl-16 border-l border-border z-50"
      style={{
        WebkitAppRegion: 'no-drag',
        right: isArcSettingsOpen ? 0 : '-50%',
        transition: 'right 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Button
        onClick={() => setIsArcSettingsOpen(false)}
        className="bg-white p-2 hover:border-black! transition-colors duration-250 ml-auto block"
      >
        <X color="#151013" />
      </Button>

      <div className="font-black uppercase space-y-6">
        <div className="mt-8">
          <h2 className="text-2xl">Paramètres de l&rsquo;Arc</h2>
        </div>

        <div className="mt-8">
          <h3 className="text-lg">RAM allouée</h3>
          <p className="text-xs text-white/50 mb-1">Ajuster la mémoire allouée à votre jeu</p>
          <RamSlider value={maxMemory} onChange={handleMemoryChange} />
        </div>

        <div>
          <h2 className="text-lg mb-0.5">Dossier de l&apos;Arc</h2>
          <p className="text-xs mb-3 text-white/50">Ouvrir le dossier de l&apos;Arc</p>
          <Button
            onClick={handleOpenGameFolder}
            className="text-black bg-white text-sm flex items-center py-1.5 px-5 gap-2 uppercase"
          >
            Ouvrir
            <FolderOpen color="black" width={16} height={16} />
          </Button>
        </div>

        <div>
          <h2 className="text-lg mb-0.5">Désinstaller l&apos;Arc</h2>
          <p className="text-xs mb-3 text-white/50">Supprimer l&apos;Arc de votre ordinateur</p>
          <Button
            onClick={handleUninstall}
            className="text-white text-sm flex items-center py-1.5 px-5 gap-2 uppercase"
            style={{ backgroundColor: '#dc2626' }}
          >
            {confirmUninstall ? 'Confirmer ?' : 'Désinstaller'}
            <Trash2 color="#fff" width={16} height={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
