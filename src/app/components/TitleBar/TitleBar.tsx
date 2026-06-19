import SettingsIcon from '../../assets/icon/settings-icon.svg?react'
import MinusIcon from '../../assets/icon/minus-icon.svg?react'
import CrossIcon from '../../assets/icon/cross-icon.svg?react'
import { useWindowStore } from '../../store/window'
import { useSettingsStore } from '../../store/settings'
import Button from '../Button/Button'

export default function TitleBar() {
  const minimize = useWindowStore((s) => s.minimize)
  const close = useWindowStore((s) => s.close)
  const toggleSettings = useSettingsStore((s) => s.toggleSettings)

  return (
    <div className="space-x-3">
      <Button onClick={toggleSettings} className="p-2">
        <SettingsIcon />
      </Button>
      <Button onClick={minimize} className="p-2">
        <MinusIcon />
      </Button>
      <Button onClick={close} className="p-2">
        <CrossIcon />
      </Button>
    </div>
  )
}
