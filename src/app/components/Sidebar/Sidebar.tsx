import blackLogo from '../../assets/images/black-logo.png'
import Arc from '../Arc/Arc'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { useArcStore } from '../../store/arc'
import { cachedImage } from '../../lib/cachedImage'
import { isProposalArc } from '../../lib/proposalArc'

export default function Sidebar() {
  const arcs = useArcStore((s) => s.arcs)
  const setArcs = useArcStore((s) => s.setArcs)
  const selectArc = useArcStore((s) => s.selectArc)
  const selectedArc = useArcStore((s) => s.selectedArc)
  const [version, setVersion] = useState('2.0.0')

  useEffect(() => {
    async function fetchArcs() {
      const [remoteRes, registryRes, versionRes] = await Promise.all([
        window.electronAPI.arcFetchRemote(),
        window.electronAPI.arcGetRegistry(),
        window.electronAPI.appGetVersion(),
      ])

      const remoteArcs = remoteRes.ok ? (remoteRes.data ?? []) : []
      const installations = registryRes.ok ? (registryRes.data ?? []) : []

      const installedIds = new Set(installations.map((i) => i.arcId))

      const items = remoteArcs.map((arc) => ({ ...arc, installed: installedIds.has(arc.slug) }))

      items.sort((a, b) => {
        const now = Date.now()
        const aStart = a.startDate ? new Date(a.startDate).getTime() : Infinity
        const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity
        const bStart = b.startDate ? new Date(b.startDate).getTime() : Infinity
        const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity

        const aActive = aStart <= now && aEnd >= now
        const bActive = bStart <= now && bEnd >= now

        if (aActive && !bActive) return -1
        if (!aActive && bActive) return 1
        if (aActive && bActive) return aEnd - bEnd

        const aUpcoming = aStart > now
        const bUpcoming = bStart > now

        if (aUpcoming && !bUpcoming) return -1
        if (!aUpcoming && bUpcoming) return 1
        if (aUpcoming && bUpcoming) return aStart - bStart

        return bStart - aStart
      })

      if (versionRes.ok && versionRes.data) setVersion(versionRes.data)

      setArcs(items)
      if (items.length > 0) selectArc(items[0])
    }

    fetchArcs()
  }, [selectArc, setArcs])

  return (
    <div className="bg-white w-20 h-full rounded-2xl px-2 py-4 text-black font-black flex flex-col space-y-4 select-none ">
      <div className="space-y-4">
        <img src={blackLogo} alt="Arcend logo" />
        <h3 className="uppercase leading-tight text-xs">Arcend Launcher</h3>
      </div>
      <div className="flex-1 space-y-0.5">
        <h5 className="uppercase font-black text-sm">Arcs</h5>
        <div className="space-y-2 flex-1">
          {arcs.map((arc) => (
            <div
              key={arc.slug}
              onClick={() => selectArc(arc)}
              className={clsx(
                'transition-opacity duration-200',
                selectedArc?.slug === arc.slug ? 'opacity-100' : 'opacity-70'
              )}
            >
              <Arc
                src={
                  arc.thumbnailUrl ? cachedImage(arc.thumbnailUrl) : 'https://placehold.co/64x64'
                }
                installed={arc.installed}
                showOverlay={!isProposalArc(arc.slug)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <span className="uppercase text-xs text-center block">Version</span>
        <div className="font-normal text-[10px] w-full p-2.5 bg-black text-center text-white rounded-xl wrap-normal">
          v{version}
        </div>
      </div>
    </div>
  )
}
