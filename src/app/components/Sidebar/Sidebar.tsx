import blackLogo from '../../assets/images/black-logo.png'
import Arc from '../Arc/Arc'
import { useEffect, useState } from 'react'
import { useArcStore } from '../../store/arc'
import type { ArcItem } from '../../store/arc'

export default function Sidebar() {
  const [arcs, setArcs] = useState<ArcItem[]>([])
  const [version, setVersion] = useState('2.0.0')
  const selectArc = useArcStore((s) => s.selectArc)

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
  }, [])

  return (
    <div className="bg-white w-20 h-full rounded-2xl px-2 py-4 text-black font-black flex flex-col space-y-4 select-none ">
      <div className="space-y-4">
        <img src={blackLogo} alt="Arcend logo" />
        <h3 className="uppercase leading-4">Arcend Server Panel</h3>
      </div>
      <div className="flex-1 space-y-0.5">
        <div className=" -space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-base">32/50</span>
            <div className="relative flex items-center justify-center mr-0.5">
              <div className="animate-ping absolute rounded-full w-2 h-2 bg-green-400 opacity-75" />
              <div className="rounded-full w-2 h-2 bg-green-500" />
            </div>
          </div>
          <span className="text-[11px] uppercase block w-full text-center">Connectés</span>
        </div>
        <div className="space-y-2 flex-1">
          {arcs.map((arc) => (
            <div key={arc.slug} onClick={() => selectArc(arc)}>
              <Arc
                src={arc.thumbnailUrl ?? 'https://placehold.co/64x64'}
                installed={arc.installed}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <span className="uppercase text-xs text-center block">Version</span>
        <div className="font-normal text-[10px] w-full py-2.5 bg-black text-center text-white rounded-xl">
          v{version}
        </div>
      </div>
    </div>
  )
}
