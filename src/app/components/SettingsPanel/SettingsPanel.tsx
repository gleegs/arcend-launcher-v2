import { useEffect } from 'react'
import { useSettingsStore } from '../../store/settings'
import CrossIcon from '../../assets/icon/cross-icon.svg?react'
import OpenIcon from '../../assets/icon/open-icon.svg?react'
import Button from '../Button/Button'
import Toggle from '../Toggle/Toggle'

export default function SettingsPanel() {
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen)
  const setIsSettingsOpen = useSettingsStore((s) => s.setIsSettingsOpen)
  const showConsole = useSettingsStore((s) => s.showConsole)
  const setShowConsole = useSettingsStore((s) => s.setShowConsole)
  const initShowConsole = useSettingsStore((s) => s.initShowConsole)

  useEffect(() => {
    initShowConsole()
  }, [initShowConsole])

  const handleOpenLauncherFolder = async () => {
    await window.electronAPI.shellOpenPath('')
  }

  return (
    <div
      className="absolute top-0 h-full rounded-2xl w-1/2 bg-black p-8 pl-16 border-l border-border z-50"
      style={{
        WebkitAppRegion: 'no-drag',
        right: isSettingsOpen ? 0 : '-50%',
        transition: 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Button
        onClick={() => setIsSettingsOpen(false)}
        className="bg-white p-2 hover:border-black! transition-colors duration-250 ml-auto block"
      >
        <CrossIcon color="#151013" />
      </Button>

      <div className=" font-black uppercase space-y-6">
        <div className="mt-8">
          <h2 className="text-2xl">Paramètres du launcher</h2>
        </div>

        <div className="mt-8">
          <h2 className="text-lg mb-0.5">Console</h2>
          <p className="text-xs mb-3 text-white/50">Afficher la console du launcher</p>
          <Toggle checked={showConsole} onChange={setShowConsole} />
        </div>

        <div>
          <h2 className="text-lg mb-0.5">Dossier du Launcher</h2>
          <p className="text-xs mb-3 text-white/50">Ouvrir le dossier du launcher</p>
          <Button
            onClick={handleOpenLauncherFolder}
            className="text-black bg-white text-sm flex items-center py-1.5 px-5 gap-2 uppercase"
          >
            Ouvrir
            <OpenIcon color="black" width={16} height={16} />
          </Button>
        </div>

        <div className="mt-8">
          <h2 className="text-lg mb-0.5">Version du launcher</h2>
          <p className="text-xs text-white/50">v2.0.0</p>
        </div>
      </div>
    </div>
  )
}
