import { describe, it, expect, vi, afterEach } from 'vitest'
import { coverIndexForTime, useArcStore, type ArcItem } from './arc'

const COVERS = [
  'https://example.com/arc/cover/arc_01_cover_sunset.jpg',
  'https://example.com/arc/cover/arc_01_cover_day.jpg',
  'https://example.com/arc/cover/arc_01_cover_night.jpg',
]

const at = (hour: number) => new Date(2026, 0, 1, hour, 0, 0)

describe('coverIndexForTime', () => {
  it('picks the day cover during daytime hours (8h-17h)', () => {
    expect(coverIndexForTime(COVERS, at(8))).toBe(1)
    expect(coverIndexForTime(COVERS, at(12))).toBe(1)
    expect(coverIndexForTime(COVERS, at(16))).toBe(1)
  })

  it('picks the sunset cover at dawn (6h-8h) and dusk (17h-21h)', () => {
    expect(coverIndexForTime(COVERS, at(6))).toBe(0)
    expect(coverIndexForTime(COVERS, at(7))).toBe(0)
    expect(coverIndexForTime(COVERS, at(17))).toBe(0)
    expect(coverIndexForTime(COVERS, at(20))).toBe(0)
  })

  it('picks the night cover at night (21h-6h)', () => {
    expect(coverIndexForTime(COVERS, at(21))).toBe(2)
    expect(coverIndexForTime(COVERS, at(0))).toBe(2)
    expect(coverIndexForTime(COVERS, at(5))).toBe(2)
  })

  it('matches regardless of array order', () => {
    const reordered = [COVERS[2], COVERS[0], COVERS[1]]
    expect(coverIndexForTime(reordered, at(12))).toBe(2)
  })

  it('falls back to 0 when no cover matches or list is empty', () => {
    expect(coverIndexForTime(['https://example.com/plain.jpg'], at(12))).toBe(0)
    expect(coverIndexForTime([], at(12))).toBe(0)
    expect(coverIndexForTime(null, at(12))).toBe(0)
  })
})

describe('refreshCoverForTime', () => {
  afterEach(() => {
    vi.useRealTimers()
    useArcStore.setState({ selectedArc: null, coverIndex: 0, autoCoverIndex: 0 })
  })

  const arc = { coverUrl: COVERS } as ArcItem

  it('updates coverIndex when the time slot changes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(at(12)) // day -> index 1
    useArcStore.getState().selectArc(arc)
    expect(useArcStore.getState().coverIndex).toBe(1)

    vi.setSystemTime(at(21)) // night -> index 2
    useArcStore.getState().refreshCoverForTime()
    expect(useArcStore.getState().coverIndex).toBe(2)
  })

  it('keeps a manual cover until the time slot changes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(at(12))
    useArcStore.getState().selectArc(arc)
    useArcStore.getState().cycleCover() // manual -> index 2
    expect(useArcStore.getState().coverIndex).toBe(2)

    useArcStore.getState().refreshCoverForTime() // still daytime, no override
    expect(useArcStore.getState().coverIndex).toBe(2)
  })
})
