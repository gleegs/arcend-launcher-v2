import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../store/settings'
import { X, FolderOpen } from 'lucide-react'
import Button from '../Button/Button'

export default function SettingsPanel() {
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen)
  const setIsSettingsOpen = useSettingsStore((s) => s.setIsSettingsOpen)
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.electronAPI.appGetVersion().then((res) => {
      if (res.ok && res.data) setVersion(res.data)
    })
  }, [])

  const handleOpenLauncherFolder = async () => {
    await window.electronAPI.shellOpenPath('')
  }

  return (
    <div
      inert={!isSettingsOpen}
      aria-hidden={!isSettingsOpen}
      className="absolute top-0 h-full rounded-2xl w-1/2 bg-black p-8 pl-16 border-l border-border z-50"
      style={{
        WebkitAppRegion: 'no-drag',
        right: isSettingsOpen ? 0 : '-50%',
        transition: 'right 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Button
        onClick={() => setIsSettingsOpen(false)}
        className="bg-white p-2 hover:border-black! transition-colors duration-250 ml-auto block"
      >
        <X color="#151013" />
      </Button>

      <div className=" font-black uppercase space-y-6">
        <div className="mt-8">
          <h2 className="text-2xl">Paramètres du launcher</h2>
        </div>

        <div>
          <h2 className="text-lg mb-0.5">Dossier du Launcher</h2>
          <p className="text-xs mb-3 text-white/50">Ouvrir le dossier du launcher</p>
          <Button
            onClick={handleOpenLauncherFolder}
            className="text-black bg-white text-sm flex items-center py-1.5 px-5 gap-2 uppercase"
          >
            Ouvrir
            <FolderOpen color="black" width={16} height={16} />
          </Button>
        </div>

        <div className="mt-8">
          <h2 className="text-lg mb-0.5">Version du launcher</h2>
          <p className="text-xs text-white/50">v{version}</p>
        </div>
      </div>
    </div>
  )
}
