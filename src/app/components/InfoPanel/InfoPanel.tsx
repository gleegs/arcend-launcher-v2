import { useState } from 'react'
import { clsx } from 'clsx'
import { ArrowRight, Users, Map } from 'lucide-react'
import { useArcStore } from '../../store/arc'
import { useLogStore } from '../../store/log'
import LogRow from '../LogRow/LogRow'

type TabId = 'article' | 'serveur' | 'logs'

const TABS: { id: TabId; label: string }[] = [
  { id: 'article', label: 'Dernier article' },
  { id: 'serveur', label: 'Serveur' },
  { id: 'logs', label: 'Logs' },
]

// TODO: remplacer par les vraies données serveur (ping MC / API).
const MOCK_PLAYERS = 19
const MOCK_SERVER_ONLINE = true

// TODO: remplacer par le dernier article récupéré depuis arcend.fr.
const MOCK_ARTICLE = {
  date: '12 juin 2026',
  title: 'Le Prologue approche',
  excerpt:
    "Préparez-vous pour le lancement de l'Arc Prologue : nouvelles quêtes, nouvelle map et bien plus encore à découvrir très bientôt sur le serveur.",
}

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
  const selectedArc = useArcStore((s) => s.selectedArc)
  const logs = useLogStore((s) => s.logs)

  const progress = computeArcProgress(selectedArc?.startDate ?? null, selectedArc?.endDate ?? null)

  return (
    <div className="w-96" style={{ WebkitAppRegion: 'no-drag' }}>
      {/* Tabs */}
      <div className="flex gap-1.5 px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-4 py-2 text-xs font-black uppercase rounded-t-xl cursor-pointer transition-colors duration-200',
              tab === t.id ? 'bg-white text-black' : 'bg-white/40 text-black/60 hover:bg-white/60'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="relative -mt-px rounded-xl bg-white p-5 text-black shadow-glass-lg">
        {tab !== 'logs' && (
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white cursor-pointer border-2 border-transparent hover:border-black transition-colors duration-250"
            aria-label="Voir plus"
          >
            <ArrowRight width={18} height={18} />
          </button>
        )}

        {tab === 'serveur' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-2xl font-black uppercase leading-none">
                {MOCK_PLAYERS} Joueurs
                <Users width={20} height={20} />
              </div>
              <div className="mt-1 text-xs font-bold uppercase text-black/50">Connectés</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-2xl font-black uppercase leading-none">
                {MOCK_SERVER_ONLINE ? 'En ligne' : 'Hors ligne'}
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: MOCK_SERVER_ONLINE ? 'var(--color-green)' : '#dc2626' }}
                />
              </div>
              <div className="mt-1 text-xs font-bold uppercase text-black/50">
                Statut du serveur
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-lg font-black uppercase leading-none">
                Progression de l&apos;arc
                <Map width={18} height={18} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/15">
                <div
                  className="h-full rounded-full bg-black"
                  style={{ width: `${progress}%`, transition: 'width 300ms ease-out' }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs font-bold uppercase">
                <span>{formatArcDate(selectedArc?.startDate ?? null)}</span>
                <span>{formatArcDate(selectedArc?.endDate ?? null)}</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'article' && (
          <div className="space-y-2 pr-14">
            <div className="text-xs font-bold uppercase text-black/40">{MOCK_ARTICLE.date}</div>
            <h3 className="text-xl font-black uppercase leading-tight">{MOCK_ARTICLE.title}</h3>
            <p className="text-sm leading-snug text-black/60">{MOCK_ARTICLE.excerpt}</p>
          </div>
        )}

        {tab === 'logs' && (
          <div className="h-44 overflow-hidden rounded-xl bg-black">
            <div className="console-scroll h-full overflow-y-auto py-1 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="mt-4 text-center text-xs text-white/60">Aucun log</div>
              ) : (
                logs.map((entry) => <LogRow key={entry.id} entry={entry} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
