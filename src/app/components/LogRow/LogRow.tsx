import clsx from 'clsx'
import type { LogEntry, LogLevel } from '../../../electron/types/launcher'

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: 'text-white/60',
  warn: 'text-amber-400',
  error: 'text-[#dc2626]',
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <div className="px-2 py-0.5 leading-tight break-all">
      <span className="text-white/40">{formatTime(entry.timestamp)} </span>
      <span className={clsx('font-medium', LEVEL_COLORS[entry.level])}>{entry.message}</span>
    </div>
  )
}
