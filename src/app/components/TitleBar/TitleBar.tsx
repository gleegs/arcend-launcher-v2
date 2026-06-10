import SettingsIcon from '../../assets/icon/settings-icon.svg?react'
import MinusIcon from '../../assets/icon/minus-icon.svg?react'
import CrossIcon from '../../assets/icon/cross-icon.svg?react'
import { useWindowStore } from '../../store/window'

export default function TitleBar() {
  const minimize = useWindowStore((s) => s.minimize)
  const close = useWindowStore((s) => s.close)

  return (
    <div className="space-x-3">
      <button
        className="cursor-pointer rounded-full bg-black p-2 border border-transparent hover:border-white transition-colors duration-250"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <SettingsIcon />
      </button>
      <button
        onClick={minimize}
        className="cursor-pointer rounded-full bg-black p-2 border border-transparent hover:border-white transition-colors duration-250"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <MinusIcon />
      </button>
      <button
        onClick={close}
        className="cursor-pointer rounded-full bg-black p-2 border border-transparent hover:border-white transition-colors duration-250"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <CrossIcon />
      </button>
    </div>
  )
}
