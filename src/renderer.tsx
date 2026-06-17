import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import './index.css'
import Sidebar from './app/components/Sidebar/Sidebar'
import { useArcStore } from './app/store/arc'
import { useWindowStore } from './app/store/window'
import TitleBar from './app/components/TitleBar/TitleBar'
import AuthButton from './app/components/AuthButton/AuthButton'
import SettingsPanel from './app/components/SettingsPanel/SettingsPanel'
import ArcSettingsPanel from './app/components/ArcSettingsPanel/ArcSettingsPanel'
import PlayButton from './app/components/PlayButton/PlayButton'
import UpdateToast from './app/components/UpdateToast/UpdateToast'
import SettingsIcon from './app/assets/icon/settings-icon.svg?react'
import { useArcSettingsStore } from './app/store/arcSettings'

const App = () => {
  const selectedArc = useArcStore((s) => s.selectedArc)
  const isHiding = useWindowStore((s) => s.isHiding)
  const setIsHiding = useWindowStore((s) => s.setIsHiding)
  const toggleArcSettings = useArcSettingsStore((s) => s.toggleArcSettings)

  useEffect(() => {
    const onFocus = () => setIsHiding(false)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [setIsHiding])

  return (
    <div
      className={`rounded-3xl bg-surface w-full h-full flex p-4 gap-4 transition-all duration-200 ${isHiding ? 'opacity-0 scale-95' : ''}`}
      style={{ WebkitAppRegion: 'drag' }}
    >
      <Sidebar />
      <main className="flex-1 rounded-2xl overflow-hidden relative">
        <img
          src={selectedArc?.coverUrl ?? 'https://placehold.co/600x400?text=Image+Not+Found'}
          alt={selectedArc?.name ?? ''}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 right-0 p-8 flex gap-8">
          <AuthButton />
          <TitleBar />
        </div>
        <div className="absolute bottom-0 right-0 p-8 flex items-center gap-4">
          {selectedArc?.installed && (
            <button
              onClick={() => toggleArcSettings()}
              className="w-12 h-12 rounded-full bg-black border border-white/10 hover:border-white flex items-center justify-center transition-colors duration-250"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              <SettingsIcon width={22} height={22} />
            </button>
          )}
          <PlayButton />
        </div>
        <SettingsPanel />
        <ArcSettingsPanel />
        <UpdateToast />
      </main>
    </div>
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')
const root = createRoot(container)
root.render(<App />)
