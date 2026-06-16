import { useEffect, useState } from 'react'
import Button from '../Button/Button'
import { useArcStore } from '../../store/arc'
import { useArcSettingsStore } from '../../store/arcSettings'
import { useAuthStore } from '../../store/auth'
import { remoteArcToMetadata } from '../../../electron/types/arc'
import DownloadIcon from '../../assets/icon/download.svg?react'
import PlayIcon from '../../assets/icon/play-icon.svg?react'

export default function PlayButton() {
  const selectedArc = useArcStore((s) => s.selectedArc)
  const selectArc = useArcStore((s) => s.selectArc)
  const authState = useAuthStore((s) => s.state)
  const getArcSettings = useArcSettingsStore((s) => s.getArcSettings)

  const [isInstalling, setIsInstalling] = useState(false)
  const [installPercent, setInstallPercent] = useState(0)
  const [isLaunching, setIsLaunching] = useState(false)

  const arcSlug = selectedArc?.slug
  const canPlay = authState.status !== 'unauthenticated'

  useEffect(() => {
    const unsubscribe = window.electronAPI.onArcInstallProgress((progress) => {
      if (progress.arcId !== arcSlug) return
      setInstallPercent(progress.percent)
      if (progress.status === 'done') {
        setIsInstalling(false)
        setInstallPercent(0)
        if (selectedArc) selectArc({ ...selectedArc, installed: true })
      } else if (progress.status === 'error') {
        setIsInstalling(false)
        setInstallPercent(0)
      }
    })
    return unsubscribe
  }, [arcSlug, selectedArc, selectArc])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onLaunchProgress((progress) => {
      if (
        progress.status === 'running' ||
        progress.status === 'closed' ||
        progress.status === 'error'
      ) {
        setIsLaunching(false)
      }
    })
    return unsubscribe
  }, [])

  if (!selectedArc) return null

  const handleInstall = async () => {
    console.log('Installe modpack')
    setIsInstalling(true)
    setInstallPercent(0)
    console.log('Selected Arc :', selectedArc)
    const metadata = remoteArcToMetadata(selectedArc)
    console.log('Arc metadata :', metadata)
    const result = await window.electronAPI.arcInstall(selectedArc.slug, metadata)
    console.log('Install result :', result)
    if (!result.ok) {
      setIsInstalling(false)
      setInstallPercent(0)
    }
  }

  const handlePlay = async () => {
    console.log('Launching game')
    setIsLaunching(true)
    const { maxMemory } = getArcSettings(selectedArc.slug)
    const result = await window.electronAPI.launchGame({
      arcId: selectedArc.slug,
      mode: authState.status === 'online' ? 'online' : 'offline',
      maxMemory: `${maxMemory}G`,
      minMemory: `${Math.floor(maxMemory / 2)}G`,
    })
    console.log('Launching result :', result)
    if (!result.ok) {
      setIsLaunching(false)
    }
  }

  const isLoading = isInstalling || isLaunching
  const label = isInstalling
    ? `Installation ${Math.round(installPercent)}%`
    : isLaunching
      ? 'Lancement...'
      : selectedArc.installed
        ? 'Jouer'
        : 'Installer'

  return (
    <Button
      onClick={selectedArc.installed ? handlePlay : handleInstall}
      disabled={isLoading || (selectedArc.installed && !canPlay)}
      className="w-72 py-2 flex justify-center items-center text-3xl font-black uppercase gap-3 border-2"
    >
      {label}
      {selectedArc.installed && !isLoading && <PlayIcon color="#fff0e6" width={26} height={26} />}
      {!selectedArc.installed && !isLoading && (
        <DownloadIcon color="#fff0e6" width={26} height={26} />
      )}
    </Button>
  )
}
