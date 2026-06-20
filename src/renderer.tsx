import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import './index.css'
import Sidebar from './app/components/Sidebar/Sidebar'
import { useArcStore } from './app/store/arc'
import { useWindowStore } from './app/store/window'
import { useProgressStore } from './app/store/progress'
import TitleBar from './app/components/TitleBar/TitleBar'
import AuthButton from './app/components/AuthButton/AuthButton'
import SocialButtons from './app/components/SocialButtons/SocialButtons'
import SettingsPanel from './app/components/SettingsPanel/SettingsPanel'
import ArcSettingsPanel from './app/components/ArcSettingsPanel/ArcSettingsPanel'
import PlayButton from './app/components/PlayButton/PlayButton'
import ProgressBar from './app/components/ProgressBar/ProgressBar'
import UpdateToast from './app/components/UpdateToast/UpdateToast'
import { useLogStore } from './app/store/log'
import Console from './app/components/Console/Console'

const App = () => {
  const selectedArc = useArcStore((s) => s.selectedArc)
  const isHiding = useWindowStore((s) => s.isHiding)
  const setIsHiding = useWindowStore((s) => s.setIsHiding)
  const installActive = useProgressStore((s) => s.install.active)
  const installPercent = useProgressStore((s) => s.install.percent)
  const installLabel = useProgressStore((s) => s.install.label)
  const installSublabel = useProgressStore((s) => s.install.sublabel)
  const installError = useProgressStore((s) => s.install.error)
  const launchActive = useProgressStore((s) => s.launch.active)
  const launchPercent = useProgressStore((s) => s.launch.percent)
  const launchLabel = useProgressStore((s) => s.launch.label)
  const launchSublabel = useProgressStore((s) => s.launch.sublabel)
  const launchError = useProgressStore((s) => s.launch.error)
  const initProgress = useProgressStore((s) => s.init)
  const initLog = useLogStore((s) => s.init)

  useEffect(() => {
    initProgress()
  }, [initProgress])

  useEffect(() => {
    initLog()
  }, [initLog])

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
        <SocialButtons />
        <div className="absolute bottom-0 right-0 p-8 flex flex-col items-end gap-3">
          <Console />
          <div className="flex items-center">
            {(installActive || installError) && (
              <ProgressBar
                percent={installPercent}
                label={installLabel}
                sublabel={installSublabel}
                error={installError}
              />
            )}
            {(launchActive || launchError) && (
              <ProgressBar
                percent={launchPercent}
                label={launchLabel}
                sublabel={launchSublabel}
                error={launchError}
              />
            )}
            <PlayButton />
          </div>
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
