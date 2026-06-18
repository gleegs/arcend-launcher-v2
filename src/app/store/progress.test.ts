import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { JavaInstallProgress } from '../../electron/types/java'
import type { PackwizInstallProgress } from '../../electron/types/packwiz'
import type { ArcInstallProgress } from '../../electron/types/arc'
import type { LaunchProgress } from '../../electron/types/launcher'
import {
  applyJavaProgress,
  applyPackwizProgress,
  applyArcProgress,
  applyLaunchProgress,
  reduceJavaPercent,
  reducePackwizPercent,
  reduceArcPercent,
  computeRanges,
  useProgressStore,
} from './progress'
import type { LaunchState } from './progress'

const IDLE_INSTALL = useProgressStore.getState().install
const IDLE_LAUNCH = useProgressStore.getState().launch

beforeEach(() => {
  useProgressStore.setState({
    install: { ...IDLE_INSTALL },
    launch: { ...IDLE_LAUNCH },
    _initialized: false,
    _seenJava: false,
    _seenPackwiz: false,
    _ranges: {
      java: [0, 40],
      packwiz: [40, 50],
      arc: [50, 100],
    },
  })
})

describe('reduceJavaPercent', () => {
  it('maps downloading on the first 30% of the Java range [0, 40]', () => {
    expect(reduceJavaPercent('downloading', 0)).toBe(0)
    expect(reduceJavaPercent('downloading', 50)).toBe(6) // 50% of (40 * 0.3) = 6
    expect(reduceJavaPercent('downloading', 100)).toBe(12)
  })

  it('maps extracting on the last 70% of the Java range [12, 40]', () => {
    expect(reduceJavaPercent('extracting', 0)).toBe(12)
    expect(reduceJavaPercent('extracting', 50)).toBe(26) // 12 + 50% of (40 * 0.7) = 26
    expect(reduceJavaPercent('extracting', 100)).toBe(40)
  })

  it('returns the Java range max on done', () => {
    expect(reduceJavaPercent('done', 0)).toBe(40)
    expect(reduceJavaPercent('done', 100)).toBe(40)
  })

  it('clamps out-of-range percents', () => {
    expect(reduceJavaPercent('downloading', 150)).toBe(12)
    expect(reduceJavaPercent('extracting', -10)).toBe(12)
  })
})

describe('reducePackwizPercent', () => {
  it('maps the packwiz range [40, 50]', () => {
    expect(reducePackwizPercent('downloading', 0)).toBe(40)
    expect(reducePackwizPercent('downloading', 50)).toBe(45)
    expect(reducePackwizPercent('downloading', 100)).toBe(50)
  })

  it('returns the packwiz range max on done', () => {
    expect(reducePackwizPercent('done', 0)).toBe(50)
  })
})

describe('reduceArcPercent', () => {
  it('maps the arc range [50, 100]', () => {
    expect(reduceArcPercent('creating_folder', 0)).toBe(50)
    expect(reduceArcPercent('syncing_packwiz', 25)).toBe(62.5)
    expect(reduceArcPercent('syncing_packwiz', 50)).toBe(75)
    expect(reduceArcPercent('creating_metadata', 75)).toBe(87.5)
  })

  it('returns 100 on done', () => {
    expect(reduceArcPercent('done', 100)).toBe(100)
  })
})

describe('applyJavaProgress', () => {
  it('activates install and sets the downloading label', () => {
    const next = applyJavaProgress(IDLE_INSTALL, {
      version: '21',
      percent: 50,
      status: 'downloading',
    } satisfies JavaInstallProgress)
    expect(next.active).toBe(true)
    expect(next.phase).toBe('java')
    expect(next.label).toBe('Téléchargement Java')
    expect(next.percent).toBe(6)
    expect(next.error).toBeNull()
  })

  it('transitions to extracting without going backwards (remap)', () => {
    let state = applyJavaProgress(IDLE_INSTALL, {
      version: '21',
      percent: 100,
      status: 'downloading',
    } satisfies JavaInstallProgress)
    expect(state.percent).toBe(12)
    // Main resets to 0 at the start of extraction — UI must not regress.
    state = applyJavaProgress(state, {
      version: '21',
      percent: 0,
      status: 'extracting',
    } satisfies JavaInstallProgress)
    expect(state.percent).toBe(12)
    expect(state.label).toBe('Installation Java')
  })

  it('done keeps install active (Packwiz/Arc may follow)', () => {
    const state = applyJavaProgress(IDLE_INSTALL, {
      version: '21',
      percent: 100,
      status: 'done',
    } satisfies JavaInstallProgress)
    expect(state.percent).toBe(40)
    expect(state.label).toBe('Java installé')
  })
})

describe('applyPackwizProgress', () => {
  it('activates install with the packwiz range', () => {
    const next = applyPackwizProgress(IDLE_INSTALL, {
      percent: 50,
      status: 'downloading',
    } satisfies PackwizInstallProgress)
    expect(next.phase).toBe('packwiz')
    expect(next.percent).toBe(45) // 40 + 50% of 10
    expect(next.label).toBe('Téléchargement Packwiz')
  })
})

describe('applyArcProgress', () => {
  it('adds a mods sublabel "Mods : x/y" when both counts are provided', () => {
    const next = applyArcProgress(IDLE_INSTALL, {
      arcId: 'test-arc',
      percent: 30,
      status: 'syncing_packwiz',
      modsDownloaded: 12,
      modsTotal: 1153,
    } satisfies ArcInstallProgress)
    expect(next.phase).toBe('arc')
    expect(next.label).toBe('Synchronisation des mods')
    expect(next.sublabel).toBe('Mods : 12/1153')
    expect(next.percent).toBe(65) // 50 + 30% of 50
  })

  it('falls back to "Mods : x" when modsTotal is missing', () => {
    const next = applyArcProgress(IDLE_INSTALL, {
      arcId: 'test-arc',
      percent: 30,
      status: 'syncing_packwiz',
      modsDownloaded: 12,
    } satisfies ArcInstallProgress)
    expect(next.sublabel).toBe('Mods : 12')
  })

  it('omits the sublabel when modsDownloaded is missing', () => {
    const next = applyArcProgress(IDLE_INSTALL, {
      arcId: 'test-arc',
      percent: 25,
      status: 'syncing_packwiz',
    } satisfies ArcInstallProgress)
    expect(next.sublabel).toBeNull()
  })

  it('resets to inactive with error on error status', () => {
    const next = applyArcProgress(IDLE_INSTALL, {
      arcId: 'test-arc',
      percent: 0,
      status: 'error',
      error: 'boom',
    } satisfies ArcInstallProgress)
    expect(next.active).toBe(false)
    expect(next.phase).toBeNull()
    expect(next.error).toBe('boom')
    expect(next.percent).toBe(0)
  })

  it('completes to 100% on done', () => {
    const next = applyArcProgress(IDLE_INSTALL, {
      arcId: 'test-arc',
      percent: 100,
      status: 'done',
    } satisfies ArcInstallProgress)
    expect(next.active).toBe(false)
    expect(next.percent).toBe(100)
    expect(next.label).toBe('Installation terminée')
  })
})

describe('applyLaunchProgress', () => {
  const PREV: LaunchState = {
    active: true,
    percent: 42,
    label: 'précédent',
    sublabel: null,
    error: null,
  }

  it.each([
    ['validating_arc', 'Vérification du modpack'],
    ['validating_auth', 'Connexion au compte'],
    ['preparing_launch', 'Préparation du lancement'],
    ['launching', 'Lancement en cours'],
  ] as const)('marks launch active with FR label for status %s', (status, expectedLabel) => {
    const next = applyLaunchProgress(
      {
        status,
        percent: 10,
      } satisfies LaunchProgress,
      PREV
    )
    expect(next.active).toBe(true)
    expect(next.label).toBe(expectedLabel)
    // Le percent est piloté par l'asymptote, pas par le payload : on conserve
    // prev.percent (les percent en dur du launcher sont ignorés).
    expect(next.percent).toBe(42)
    expect(next.sublabel).toBeNull()
  })

  it('deactivates launch on running and forces percent to 100', () => {
    const next = applyLaunchProgress(
      {
        status: 'running',
        percent: 100,
      } satisfies LaunchProgress,
      PREV
    )
    expect(next.active).toBe(false)
    expect(next.label).toBe("Jeu en cours d'exécution")
    expect(next.percent).toBe(100)
  })

  it('deactivates launch on closed and forces percent to 100', () => {
    const next = applyLaunchProgress(
      {
        status: 'closed',
        percent: 100,
        exitCode: 0,
      } satisfies LaunchProgress,
      PREV
    )
    expect(next.active).toBe(false)
    expect(next.percent).toBe(100)
  })

  it('captures error and resets percent to 0', () => {
    const next = applyLaunchProgress(
      {
        status: 'error',
        percent: 0,
        error: 'crash',
      } satisfies LaunchProgress,
      PREV
    )
    expect(next.active).toBe(false)
    expect(next.error).toBe('crash')
    expect(next.percent).toBe(0)
  })
})

describe('computeRanges', () => {
  it('returns the default full ranges when both Java and Packwiz are seen', () => {
    expect(computeRanges(true, true)).toEqual({
      java: [0, 40],
      packwiz: [40, 50],
      arc: [50, 100],
    })
  })

  it('collapses the packwiz range when only Java is seen (Packwiz skipped)', () => {
    expect(computeRanges(true, false)).toEqual({
      java: [0, 40],
      packwiz: [40, 40],
      arc: [40, 100],
    })
  })

  it('redistributes everything when Java is skipped but Packwiz is seen', () => {
    expect(computeRanges(false, true)).toEqual({
      java: [0, 0],
      packwiz: [0, 20],
      arc: [20, 100],
    })
  })

  it('gives the whole range to Arc when both Java and Packwiz are skipped', () => {
    expect(computeRanges(false, false)).toEqual({
      java: [0, 0],
      packwiz: [0, 0],
      arc: [0, 100],
    })
  })
})

describe('useProgressStore.startInstall', () => {
  it('activates the bar at 0% with the "Préparation…" label and resets tracking', () => {
    useProgressStore.setState({
      install: { ...IDLE_INSTALL, percent: 75, phase: 'arc' },
      _seenJava: true,
      _seenPackwiz: true,
    })
    useProgressStore.getState().startInstall()
    const { install, _seenJava, _seenPackwiz } = useProgressStore.getState()
    expect(install.active).toBe(true)
    expect(install.percent).toBe(0)
    expect(install.label).toBe('Préparation…')
    expect(install.phase).toBeNull()
    expect(_seenJava).toBe(false)
    expect(_seenPackwiz).toBe(false)
  })
})

describe('useProgressStore.init', () => {
  it('subscribes to all 4 IPC channels once', () => {
    const noop = () => undefined
    const subs = {
      onJavaInstallProgress: vi.fn(() => noop),
      onPackwizInstallProgress: vi.fn(() => noop),
      onArcInstallProgress: vi.fn(() => noop),
      onLaunchProgress: vi.fn(() => noop),
    }
    const original = window.electronAPI
    window.electronAPI = { ...original, ...subs } as typeof window.electronAPI

    useProgressStore.getState().init()
    useProgressStore.getState().init() // idempotent

    expect(subs.onJavaInstallProgress).toHaveBeenCalledTimes(1)
    expect(subs.onPackwizInstallProgress).toHaveBeenCalledTimes(1)
    expect(subs.onArcInstallProgress).toHaveBeenCalledTimes(1)
    expect(subs.onLaunchProgress).toHaveBeenCalledTimes(1)

    window.electronAPI = original
  })

  it('dispatches IPC payloads through the reducers into state', () => {
    const noop = () => undefined
    const handlers: {
      java: ((p: JavaInstallProgress) => void) | null
      arc: ((p: ArcInstallProgress) => void) | null
    } = { java: null, arc: null }
    const subs = {
      onJavaInstallProgress: vi.fn((cb: (p: JavaInstallProgress) => void) => {
        handlers.java = cb
        return noop
      }),
      onPackwizInstallProgress: vi.fn(() => noop),
      onArcInstallProgress: vi.fn((cb: (p: ArcInstallProgress) => void) => {
        handlers.arc = cb
        return noop
      }),
      onLaunchProgress: vi.fn(() => noop),
    }
    const original = window.electronAPI
    window.electronAPI = { ...original, ...subs } as typeof window.electronAPI

    useProgressStore.getState().init()
    expect(handlers.java).not.toBeNull()
    handlers.java!({ version: '21', percent: 50, status: 'downloading' })
    expect(useProgressStore.getState().install.phase).toBe('java')
    expect(useProgressStore.getState().install.percent).toBe(6)

    expect(handlers.arc).not.toBeNull()
    handlers.arc!({ arcId: 'a', percent: 25, status: 'syncing_packwiz', modsDownloaded: 3 })
    expect(useProgressStore.getState().install.phase).toBe('arc')
    expect(useProgressStore.getState().install.sublabel).toBe('Mods : 3')

    window.electronAPI = original
  })

  it('starts at 0% when Java and Packwiz are already installed (skipped)', () => {
    const noop = () => undefined
    const handlers: { arc: ((p: ArcInstallProgress) => void) | null } = { arc: null }
    const subs = {
      onJavaInstallProgress: vi.fn(() => noop),
      onPackwizInstallProgress: vi.fn(() => noop),
      onArcInstallProgress: vi.fn((cb: (p: ArcInstallProgress) => void) => {
        handlers.arc = cb
        return noop
      }),
      onLaunchProgress: vi.fn(() => noop),
    }
    const original = window.electronAPI
    window.electronAPI = { ...original, ...subs } as typeof window.electronAPI

    useProgressStore.getState().init()
    // L'utilisateur clique sur Installer : la barre démarre à 0% en attendant
    // le premier event IPC. Java et Packwiz sont déjà installés, donc aucun
    // event Java/Packwiz ne sera jamais émis — le premier event est Arc direct.
    useProgressStore.getState().startInstall()
    expect(useProgressStore.getState().install.percent).toBe(0)
    expect(useProgressStore.getState().install.label).toBe('Préparation…')

    expect(handlers.arc).not.toBeNull()
    // creating_folder local 0% → Arc plage [0, 100] → global 0%.
    handlers.arc!({ arcId: 'a', percent: 0, status: 'creating_folder' })
    expect(useProgressStore.getState().install.percent).toBe(0)
    expect(useProgressStore.getState()._ranges.arc).toEqual([0, 100])

    // syncing_packwiz local 25% → global 25%.
    handlers.arc!({
      arcId: 'a',
      percent: 25,
      status: 'syncing_packwiz',
      modsDownloaded: 50,
      modsTotal: 100,
    })
    expect(useProgressStore.getState().install.percent).toBe(25)
    expect(useProgressStore.getState().install.sublabel).toBe('Mods : 50/100')

    window.electronAPI = original
  })
})

describe('launch asymptote timer', () => {
  let launchHandler: ((p: LaunchProgress) => void) | null
  let originalAPI: typeof window.electronAPI

  beforeEach(() => {
    vi.useFakeTimers()
    launchHandler = null
    originalAPI = window.electronAPI
    const noop = () => undefined
    window.electronAPI = {
      ...originalAPI,
      onJavaInstallProgress: vi.fn(() => noop),
      onPackwizInstallProgress: vi.fn(() => noop),
      onArcInstallProgress: vi.fn(() => noop),
      onLaunchProgress: vi.fn((cb: (p: LaunchProgress) => void) => {
        launchHandler = cb
        return noop
      }),
    } as typeof window.electronAPI

    // Force un nouvel init pour rebrancher le handler IPC mocké.
    useProgressStore.setState({ _initialized: false })
    useProgressStore.getState().init()
  })

  afterEach(() => {
    useProgressStore.getState().resetLaunch()
    window.electronAPI = originalAPI
    vi.useRealTimers()
  })

  it('interpolates from 0% toward 98% over 50s starting from the first active event', () => {
    expect(launchHandler).not.toBeNull()
    // Premier event actif : l'asymptote démarre depuis 0 %.
    launchHandler!({ status: 'validating_arc', percent: 0 } satisfies LaunchProgress)
    expect(useProgressStore.getState().launch.percent).toBe(0)

    // +12.5s (t=0.25) : ease-out quad → ~42.9 %.
    vi.advanceTimersByTime(12_500)
    const percent12 = useProgressStore.getState().launch.percent
    expect(percent12).toBeGreaterThan(35)
    expect(percent12).toBeLessThan(50)

    // +12.5s (total 25s, t=0.5) : ~73.5 %, strictement supérieur.
    vi.advanceTimersByTime(12_500)
    const percent25 = useProgressStore.getState().launch.percent
    expect(percent25).toBeGreaterThan(percent12)

    // +25s (total 50s, t=1) : ~98 %.
    vi.advanceTimersByTime(25_000)
    expect(useProgressStore.getState().launch.percent).toBeCloseTo(98, 0)
  })

  it('keeps advancing through status transitions without resetting', () => {
    expect(launchHandler).not.toBeNull()
    launchHandler!({ status: 'validating_arc', percent: 0 } satisfies LaunchProgress)
    vi.advanceTimersByTime(5_000)
    const beforeTransition = useProgressStore.getState().launch.percent

    // Transition vers validating_auth : le percent ne doit pas redescendre,
    // l'asymptote continue de piloter la progression.
    launchHandler!({ status: 'validating_auth', percent: 10 } satisfies LaunchProgress)
    expect(useProgressStore.getState().launch.label).toBe('Connexion au compte')
    expect(useProgressStore.getState().launch.percent).toBeGreaterThanOrEqual(beforeTransition)

    vi.advanceTimersByTime(5_000)
    expect(useProgressStore.getState().launch.percent).toBeGreaterThan(beforeTransition)
  })

  it('caps the displayed percent at the 98% target', () => {
    expect(launchHandler).not.toBeNull()
    launchHandler!({ status: 'validating_arc', percent: 0 } satisfies LaunchProgress)
    vi.advanceTimersByTime(120_000) // bien au-delà de 50s
    expect(useProgressStore.getState().launch.percent).toBeLessThanOrEqual(98)
  })

  it('stops the asymptote and forces 100% when running arrives', () => {
    expect(launchHandler).not.toBeNull()
    launchHandler!({ status: 'launching', percent: 60 } satisfies LaunchProgress)
    vi.advanceTimersByTime(20_000)

    launchHandler!({ status: 'running', percent: 100 } satisfies LaunchProgress)
    expect(useProgressStore.getState().launch.percent).toBe(100)

    // Le timer doit être arrêté : le percent ne doit plus changer.
    vi.advanceTimersByTime(30_000)
    expect(useProgressStore.getState().launch.percent).toBe(100)
  })

  it('resetLaunch stops the timer and resets state', () => {
    expect(launchHandler).not.toBeNull()
    launchHandler!({ status: 'validating_arc', percent: 0 } satisfies LaunchProgress)
    vi.advanceTimersByTime(10_000)
    expect(useProgressStore.getState().launch.active).toBe(true)

    useProgressStore.getState().resetLaunch()
    expect(useProgressStore.getState().launch.active).toBe(false)
    expect(useProgressStore.getState().launch.percent).toBe(0)

    // Plus aucun tick ne doit s'exécuter après le reset.
    vi.advanceTimersByTime(60_000)
    expect(useProgressStore.getState().launch.percent).toBe(0)
  })

  it('restarts a fresh asymptote after a complete cycle', () => {
    expect(launchHandler).not.toBeNull()
    // Première partie : validating_arc → running.
    launchHandler!({ status: 'validating_arc', percent: 0 } satisfies LaunchProgress)
    vi.advanceTimersByTime(30_000)
    const firstRun = useProgressStore.getState().launch.percent
    expect(firstRun).toBeGreaterThan(60) // t=0.6 → ~80 %

    // running stoppe l'asymptote et force 100 %.
    launchHandler!({ status: 'running', percent: 100 } satisfies LaunchProgress)
    expect(useProgressStore.getState().launch.percent).toBe(100)

    // Deuxième partie après reset : l'asymptote redémarre depuis 0.
    useProgressStore.getState().resetLaunch()
    launchHandler!({ status: 'validating_arc', percent: 0 } satisfies LaunchProgress)
    expect(useProgressStore.getState().launch.percent).toBe(0)
    vi.advanceTimersByTime(15_000)
    const secondRun = useProgressStore.getState().launch.percent
    expect(secondRun).toBeLessThan(firstRun) // redémarré depuis 0, donc plus bas
  })
})
