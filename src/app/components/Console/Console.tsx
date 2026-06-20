import { useEffect, useMemo, useRef } from 'react'
import { useSettingsStore } from '../../store/settings'
import { useLogStore } from '../../store/log'
import LogRow from '../LogRow/LogRow'

export default function Console() {
  const showConsole = useSettingsStore((s) => s.showConsole)
  const logs = useLogStore((s) => s.logs)
  const filters = useLogStore((s) => s.filters)

  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  const filteredLogs = useMemo(() => logs.filter((l) => filters.includes(l.level)), [logs, filters])

  useEffect(() => {
    if (!showConsole) return
    const el = scrollRef.current
    if (el && isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [filteredLogs, showConsole])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
  }

  if (!showConsole) return null

  return (
    <div
      className="w-80 h-40 rounded-xl bg-black border border-border flex flex-col overflow-hidden p-2"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <h4 className=" uppercase text-lg font-bold">Logs</h4>
      <div className="w-full bg-white/20 h-[1px] mb-1"></div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-[11px] py-1 console-scroll"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-white text-center text-xs mt-4">Aucun log</div>
        ) : (
          filteredLogs.map((entry) => <LogRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}
