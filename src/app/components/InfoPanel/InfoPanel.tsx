import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { ArrowRight, Users, Map, RefreshCw } from 'lucide-react'
import { useArcStore } from '../../store/arc'
import { useLogStore } from '../../store/log'
import LogRow from '../LogRow/LogRow'
import type { LatestArticle } from '../../../electron/types/article'

type TabId = 'article' | 'serveur' | 'logs'

const TABS: { id: TabId; label: string }[] = [
  { id: 'article', label: 'Dernier article' },
  { id: 'serveur', label: 'Serveur' },
  { id: 'logs', label: 'Logs' },
]

// TODO: remplacer par les vraies données serveur (ping MC / API).
const MOCK_PLAYERS = 19
const MOCK_SERVER_ONLINE = true

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long' })

function formatArcDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

function computeArcProgress(start: string | null, end: string | null): number {
  if (!start || !end) return 0
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) return 0
  const ratio = (Date.now() - startTime) / (endTime - startTime)
  return Math.min(100, Math.max(0, ratio * 100))
}

export default function InfoPanel() {
  const [tab, setTab] = useState<TabId>('serveur')
  const [article, setArticle] = useState<LatestArticle | null>(null)
  const selectedArc = useArcStore((s) => s.selectedArc)
  const logs = useLogStore((s) => s.logs)

  const progress = computeArcProgress(selectedArc?.startDate ?? null, selectedArc?.endDate ?? null)

  useEffect(() => {
    window.electronAPI
      .articleFetchLatest()
      .then((res) => {
        if (res.ok && res.data) setArticle(res.data)
      })
      .catch(() => undefined)
  }, [])

  return (
    <div className="w-[400px]" style={{ WebkitAppRegion: 'no-drag' }}>
      {/* Tabs */}
      <div className="flex">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-4 py-2 text-[12px] font-black uppercase cursor-pointer transition-colors duration-200',
              i === 0 && 'rounded-tl-[8px]',
              i === TABS.length - 1 && 'rounded-tr-[8px]',
              i < TABS.length - 1 && 'border-r border-black',
              tab === t.id ? 'bg-white text-black' : 'bg-white/40 text-black/60 hover:bg-white/60'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div
        className={clsx(
          'relative -mt-px h-[156px] overflow-hidden rounded-[4px] rounded-tl-none p-3 shadow-glass-lg',
          tab === 'logs' ? 'bg-black text-white' : 'bg-white text-black'
        )}
      >
        {tab === 'serveur' && (
          <button
            type="button"
            className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white cursor-pointer border-2 border-transparent hover:border-black hover:scale-110 transition-all duration-250"
            aria-label="Rafraîchir"
          >
            <RefreshCw width={14} height={14} />
          </button>
        )}

        {tab === 'serveur' && (
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[16px] font-black uppercase leading-none">
                {MOCK_PLAYERS} Joueurs
                <Users width={16} height={16} />
              </div>
              <div className="mt-0.5 text-[10px] font-bold uppercase text-black/50">Connectés</div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[16px] font-black uppercase leading-none">
                {MOCK_SERVER_ONLINE ? 'En ligne' : 'Hors ligne'}
                <span
                  className={clsx(
                    'inline-block h-2.5 w-2.5 rounded-full',
                    MOCK_SERVER_ONLINE && 'animate-pulse'
                  )}
                  style={{ backgroundColor: MOCK_SERVER_ONLINE ? 'var(--color-green)' : '#dc2626' }}
                />
              </div>
              <div className="mt-0.5 text-[10px] font-bold uppercase text-black/50">
                Statut du serveur
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[16px] font-black uppercase leading-none">
                Progression de l&apos;arc
                <Map width={16} height={16} />
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/15">
                <div
                  className="h-full rounded-full bg-black"
                  style={{ width: `${progress}%`, transition: 'width 300ms ease-out' }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] font-bold uppercase">
                <span>{formatArcDate(selectedArc?.startDate ?? null)}</span>
                <span>{formatArcDate(selectedArc?.endDate ?? null)}</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'article' &&
          (article ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group absolute inset-0 block overflow-hidden rounded-[4px] rounded-tl-none"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              {article.image && (
                <img
                  src={article.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(21,16,19,0) 60%, rgba(21,16,19,0.6) 80%)',
                }}
              />
              <div className="absolute inset-0 flex items-end justify-between gap-3 p-3 text-white">
                <h3 className="line-clamp-2 text-[16px] font-black uppercase leading-tight">
                  {article.title}
                </h3>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-black border-2 border-transparent transition-all duration-250 group-hover:scale-110">
                  <ArrowRight width={14} height={14} />
                </span>
              </div>
            </a>
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-bold uppercase text-black/40">
              Aucun article
            </div>
          ))}

        {tab === 'logs' && (
          <div className="console-scroll h-full overflow-y-auto font-mono text-[11px]">
            {logs.length === 0 ? (
              <div className="px-2 py-0.5 text-xs text-white/60">Aucun log</div>
            ) : (
              logs.map((entry) => <LogRow key={entry.id} entry={entry} />)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
