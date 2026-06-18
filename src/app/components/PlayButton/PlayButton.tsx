import { useEffect, useRef } from 'react'
import Button from '../Button/Button'
import { useArcStore } from '../../store/arc'
import { useArcSettingsStore } from '../../store/arcSettings'
import { useAuthStore } from '../../store/auth'
import { useProgressStore } from '../../store/progress'
import { remoteArcToMetadata } from '../../../electron/types/arc'
import DownloadIcon from '../../assets/icon/download.svg?react'
import PlayIcon from '../../assets/icon/play-icon.svg?react'

export default function PlayButton() {
  const selectedArc = useArcStore((s) => s.selectedArc)
  const setArcInstalled = useArcStore((s) => s.setArcInstalled)
  const authState = useAuthStore((s) => s.state)
  const getArcSettings = useArcSettingsStore((s) => s.getArcSettings)

  const install = useProgressStore((s) => s.install)
  const launch = useProgressStore((s) => s.launch)
  const startInstall = useProgressStore((s) => s.startInstall)
  const resetInstall = useProgressStore((s) => s.resetInstall)
  const resetLaunch = useProgressStore((s) => s.resetLaunch)

  const isInstalling = install.active
  const isLaunching = launch.active
  const canPlay = authState.status !== 'unauthenticated'

  // Détecte la fin d'installation (transition active → inactive avec succès)
  // pour marquer l'arc sélectionné comme installé dans le store Arc.
  const wasInstallingRef = useRef(false)
  useEffect(() => {
    const justCompleted =
      wasInstallingRef.current && !install.active && install.percent === 100 && !install.error
    if (justCompleted && selectedArc) {
      setArcInstalled(selectedArc.slug, true)
    }
    wasInstallingRef.current = install.active
  }, [install.active, install.percent, install.error, selectedArc, setArcInstalled])

  if (!selectedArc) return null

  const handleInstall = async () => {
    // `startInstall` (et non resetInstall) pour activer la barre à 0% avec le
    // libellé « Préparation… » et reset le tracking des phases vues. Comme ça,
    // même si Java/Packwiz sont déjà installés et n'émettront aucun event,
    // les plages seront recalculées dynamiquement au premier event reçu.
    startInstall()
    const metadata = remoteArcToMetadata(selectedArc)
    const result = await window.electronAPI.arcInstall(selectedArc.slug, metadata)
    if (!result.ok) {
      resetInstall()
    }
  }

  const handlePlay = async () => {
    resetLaunch()
    const { maxMemory } = getArcSettings(selectedArc.slug)
    const result = await window.electronAPI.launchGame({
      arcId: selectedArc.slug,
      mode: authState.status === 'online' ? 'online' : 'offline',
      maxMemory: `${maxMemory}G`,
      minMemory: `${Math.floor(maxMemory / 2)}G`,
    })
    if (!result.ok) {
      resetLaunch()
    }
  }

  const isLoading = isInstalling || isLaunching
  const label = isInstalling
    ? `Installation ${Math.round(install.percent)}%`
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
