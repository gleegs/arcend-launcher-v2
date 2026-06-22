import { Settings, Minus, X } from 'lucide-react'
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
        <Settings />
      </Button>
      <Button onClick={minimize} className="p-2">
        <Minus />
      </Button>
      <Button onClick={close} className="p-2">
        <X />
      </Button>
    </div>
  )
}
