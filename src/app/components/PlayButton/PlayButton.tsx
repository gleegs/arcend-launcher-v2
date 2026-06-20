import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import Button from '../Button/Button'
import DropdownMenu, { type MenuItem } from '../DropdownMenu/DropdownMenu'
import { useArcStore } from '../../store/arc'
import { useArcSettingsStore } from '../../store/arcSettings'
import { useAuthStore } from '../../store/auth'
import { useProgressStore } from '../../store/progress'
import { remoteArcToMetadata } from '../../../electron/types/arc'
import DownloadIcon from '../../assets/icon/download.svg?react'
import PlayIcon from '../../assets/icon/play-icon.svg?react'
import EllipsisIcon from '../../assets/icon/ellipsis-vertical.svg?react'
import SettingsIcon from '../../assets/icon/settings-icon.svg?react'
import TrashIcon from '../../assets/icon/trash-icon.svg?react'

export default function PlayButton() {
  const selectedArc = useArcStore((s) => s.selectedArc)
  const setArcInstalled = useArcStore((s) => s.setArcInstalled)
  const uninstallArc = useArcStore((s) => s.uninstallArc)
  const authState = useAuthStore((s) => s.state)
  const getArcSettings = useArcSettingsStore((s) => s.getArcSettings)
  const toggleArcSettings = useArcSettingsStore((s) => s.toggleArcSettings)

  const install = useProgressStore((s) => s.install)
  const launch = useProgressStore((s) => s.launch)
  const startInstall = useProgressStore((s) => s.startInstall)
  const resetInstall = useProgressStore((s) => s.resetInstall)
  const resetLaunch = useProgressStore((s) => s.resetLaunch)

  const [confirmUninstall, setConfirmUninstall] = useState(false)

  const isInstalling = install.active
  const isLaunching = launch.active
  const canPlay = authState.status !== 'unauthenticated'

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

  const handleUninstallClick = async () => {
    if (!confirmUninstall) {
      setConfirmUninstall(true)
      return
    }
    await uninstallArc(selectedArc.slug)
    setConfirmUninstall(false)
  }

  const isLoading = isInstalling || isLaunching
  const showKebab = selectedArc.installed && !isLoading
  const label = isInstalling
    ? `Installation ${Math.round(install.percent)}%`
    : isLaunching
      ? 'Lancement...'
      : selectedArc.installed
        ? 'Jouer'
        : 'Installer'

  if (showKebab) {
    const menuItems: MenuItem[] = [
      {
        label: 'Paramètres',
        icon: <SettingsIcon color="#fff0e6" width={16} height={16} />,
        onClick: () => toggleArcSettings(),
      },
      {
        label: confirmUninstall ? 'Confirmer ?' : 'Désinstaller',
        danger: true,
        keepOpenOnClick: !confirmUninstall,
        icon: <TrashIcon color="#fff" width={16} height={16} />,
        onClick: handleUninstallClick,
      },
    ]

    return (
      <div
        className=" w-80 flex items-stretch rounded-full border-2 border-transparent hover:border-white bg-black shadow-button transition-colors duration-250 cursor-pointer"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <button
          onClick={handlePlay}
          disabled={!canPlay}
          className={clsx(
            'flex flex-1 items-center justify-center gap-3 pl-6 pr-5 py-2 text-3xl font-black uppercase rounded-l-full cursor-pointer',
            !canPlay && 'opacity-50 cursor-not-allowed'
          )}
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {label}
          <PlayIcon color="#fff0e6" width={26} height={26} />
        </button>
        <div className="w-px bg-white/25 my-3" aria-hidden />
        <DropdownMenu
          items={menuItems}
          onClose={() => setConfirmUninstall(false)}
          trigger={
            <button
              type="button"
              className="flex items-center px-4 cursor-pointer rounded-r-full transition-colors duration-150"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              <EllipsisIcon color="#fff0e6" />
            </button>
          }
        />
      </div>
    )
  }

  return (
    <Button
      onClick={selectedArc.installed ? handlePlay : handleInstall}
      disabled={isLoading || (selectedArc.installed && !canPlay)}
      className={clsx(
        'w-80 py-2 flex justify-center items-center text-3xl font-black uppercase gap-3 border-2',
        isLaunching && '!opacity-100 border-0 hover:border-0'
      )}
    >
      {label}
      {selectedArc.installed && !isLoading && <PlayIcon color="#fff0e6" width={26} height={26} />}
      {!selectedArc.installed && !isLoading && (
        <DownloadIcon color="#fff0e6" width={26} height={26} />
      )}
    </Button>
  )
}
