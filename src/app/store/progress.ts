import { create } from 'zustand'
import type { JavaInstallProgress, JavaInstallStatus } from '../../electron/types/java'
import type { PackwizInstallProgress, PackwizInstallStatus } from '../../electron/types/packwiz'
import type { ArcInstallProgress, ArcInstallStatus } from '../../electron/types/arc'
import type { LaunchProgress, LaunchStatus } from '../../electron/types/launcher'

export type InstallPhase = 'java' | 'packwiz' | 'arc'

export interface InstallState {
  active: boolean
  phase: InstallPhase | null
  /** Pourcentage global agrégé [0, 100]. */
  percent: number
  label: string
  /** Détail secondaire (ex. « Mods : 12/1153 »). */
  sublabel: string | null
  error: string | null
}

export interface LaunchState {
  active: boolean
  /** Pourcentage [0, 100]. Pendant la phase launching, interpolé par l'asymptote. */
  percent: number
  label: string
  /** Toujours null pour le launch (compat ProgressBar). */
  sublabel: string | null
  error: string | null
}

/** Plages globales allouées à chaque phase, recalculées dynamiquement. */
export interface InstallRanges {
  java: [number, number]
  packwiz: [number, number]
  arc: [number, number]
}

interface ProgressState {
  install: InstallState
  launch: LaunchState
  /** Abonne les 4 listeners IPC. Idempotent via le guard `_initialized`. */
  init: () => void
  /**
   * Active l'état d'installation à 0 % avec le libellé « Préparation… » et
   * réinitialise le tracking des phases vues. À appeler juste avant
   * `arcInstall` (côté PlayButton) pour que la barre démarre à 0 % même si
   * Java/Packwiz sont déjà installés et ne vont émettre aucun événement.
   */
  startInstall: () => void
  /** Réinitialise l'état d'installation (après done/error ou manuellement). */
  resetInstall: () => void
  /** Réinitialise l'état de lancement. */
  resetLaunch: () => void
  _initialized: boolean
  _seenJava: boolean
  _seenPackwiz: boolean
  _ranges: InstallRanges
}

/**
 * Plages par défaut quand toutes les phases sont actives (premier install).
 * Packwiz bootstrap est très court (jar de ~99 Ko) donc plage réduite [40, 50].
 * La phase Arc (sync mods + finalisation) est de loin la plus longue, donc
 * [50, 100].
 */
const DEFAULT_RANGES: InstallRanges = {
  java: [0, 40],
  packwiz: [40, 50],
  arc: [50, 100],
}

/**
 * Recalcule les plages en fonction des phases réellement actives.
 *
 * Si Java est skippé (déjà installé), sa plage est vide et la place est
 * redistribuée : Packwiz obtient [0, 20] et Arc [20, 100]. Si Packwiz est
 * aussi skippé, Arc couvre [0, 100]. On s'assure ainsi que la barre démarre
 * toujours à 0 %, quel que soit l'état préalable du système.
 */
export function computeRanges(seenJava: boolean, seenPackwiz: boolean): InstallRanges {
  if (seenJava) {
    if (seenPackwiz) {
      return { java: [0, 40], packwiz: [40, 50], arc: [50, 100] }
    }
    // Java actif, Packwiz skippé : on donne la place de Packwiz à Arc.
    return { java: [0, 40], packwiz: [40, 40], arc: [40, 100] }
  }
  if (seenPackwiz) {
    // Java skippé, Packwiz actif.
    return { java: [0, 0], packwiz: [0, 20], arc: [20, 100] }
  }
  // Java + Packwiz skippés (premier event direct en Arc, ou état initial).
  return { java: [0, 0], packwiz: [0, 0], arc: [0, 100] }
}

/**
 * Part de la plage Java allouée au download (rapide) vs l'extraction (lente).
 * Le download représente en général quelques secondes, l'extraction plusieurs
 * dizaines de secondes pour un JRE complet. On donne 30 % au download et 70 %
 * à l'extraction pour éviter que la barre ne semble figée pendant l'extract.
 */
const JAVA_DOWNLOAD_SHARE = 0.3
const JAVA_EXTRACT_SHARE = 0.7

const JAVA_LABELS: Record<JavaInstallStatus, string> = {
  downloading: 'Téléchargement Java',
  extracting: 'Installation Java',
  done: 'Java installé',
}

const PACKWIZ_LABELS: Record<PackwizInstallStatus, string> = {
  downloading: 'Téléchargement Packwiz',
  done: 'Packwiz installé',
}

const ARC_LABELS: Record<ArcInstallStatus, string> = {
  creating_folder: 'Préparation du dossier',
  syncing_packwiz: 'Synchronisation des mods',
  creating_metadata: 'Finalisation',
  done: 'Installation terminée',
  error: "Échec de l'installation",
}

const LAUNCH_LABELS: Record<LaunchStatus, string> = {
  validating_arc: 'Vérification du modpack',
  validating_auth: 'Connexion au compte',
  preparing_launch: 'Préparation du lancement',
  launching: 'Lancement en cours',
  running: "Jeu en cours d'exécution",
  closed: 'Jeu fermé',
  error: 'Échec du lancement',
}

const INSTALL_IDLE: InstallState = {
  active: false,
  phase: null,
  percent: 0,
  label: '',
  sublabel: null,
  error: null,
}

const INSTALL_PREPARING: InstallState = {
  active: true,
  phase: null,
  percent: 0,
  label: 'Préparation…',
  sublabel: null,
  error: null,
}

const LAUNCH_IDLE: LaunchState = {
  active: false,
  percent: 0,
  label: '',
  sublabel: null,
  error: null,
}

/**
 * Cible asymptotique et durée de l'interpolation temporelle couvrant tout le
 * lancement (validating_arc → running). Le launcher envoie des percent en dur
 * par paliers (0/10/30/60/100) qui donnent l'impression que la barre stagne,
 * et MCLC télécharge assets/libs en interne sans granularité. On pilote donc
 * le percent via une ease-out continue de 0 % → 98 % sur 50 s ; le 100 % final
 * n'est atteint qu'à l'arrivée du status `running` (jeu démarré).
 */
const LAUNCH_ASYMPTOTE_TARGET = 98
const LAUNCH_ASYMPTOTE_DURATION_MS = 50_000
const LAUNCH_ASYMPTOTE_TICK_MS = 250

let launchAsymptoteTimer: ReturnType<typeof setInterval> | null = null

function startLaunchAsymptote(
  set: (partial: { launch: LaunchState }) => void,
  get: () => ProgressState
): void {
  // L'asymptote tourne déjà : on ne la redémarre pas. Les transitions de status
  // (validating_arc → validating_auth → preparing_launch → launching) ne doivent
  // pas reset la progression. L'asymptote est relancée uniquement après un stop
  // (running/closed/error/resetLaunch).
  if (launchAsymptoteTimer !== null) return
  const startTime = Date.now()
  const startPercent = get().launch.percent
  launchAsymptoteTimer = setInterval(() => {
    const t = Math.min((Date.now() - startTime) / LAUNCH_ASYMPTOTE_DURATION_MS, 1)
    // ease-out quad : rapide au début, ralentit en fin de course.
    const eased = 1 - Math.pow(1 - t, 2)
    const percent = startPercent + (LAUNCH_ASYMPTOTE_TARGET - startPercent) * eased
    set({ launch: { ...get().launch, percent: Math.min(percent, LAUNCH_ASYMPTOTE_TARGET) } })
  }, LAUNCH_ASYMPTOTE_TICK_MS)
}

function stopLaunchAsymptote(): void {
  if (launchAsymptoteTimer !== null) {
    clearInterval(launchAsymptoteTimer)
    launchAsymptoteTimer = null
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/**
 * Remappe un percent Java local [0, 100] en percent global sur la plage
 * `range`, en séparant download et extraction pour lisser le reset à 0 entre
 * les deux phases (le main envoie `{ percent: 0, status: 'extracting' }` au
 * début de l'extract).
 *
 * - `downloading` : occuppe les premiers 30 % de la plage Java.
 * - `extracting`  : occuppe les 70 % restants.
 * - `done`        : borne haute de la plage Java.
 */
export function reduceJavaPercent(
  status: JavaInstallStatus,
  localPercent: number,
  range: [number, number] = DEFAULT_RANGES.java
): number {
  const [min, max] = range
  const span = max - min
  if (span <= 0) return min
  if (status === 'done') return max
  if (status === 'downloading') {
    return min + (clamp(localPercent, 0, 100) / 100) * span * JAVA_DOWNLOAD_SHARE
  }
  // extracting
  return (
    min +
    span * JAVA_DOWNLOAD_SHARE +
    (clamp(localPercent, 0, 100) / 100) * span * JAVA_EXTRACT_SHARE
  )
}

export function reducePackwizPercent(
  status: PackwizInstallStatus,
  localPercent: number,
  range: [number, number] = DEFAULT_RANGES.packwiz
): number {
  const [min, max] = range
  if (max - min <= 0) return min
  if (status === 'done') return max
  return min + (clamp(localPercent, 0, 100) / 100) * (max - min)
}

/**
 * Remappe un percent Arc local [0, 100] en percent global sur la plage
 * `range`. Le main envoie des percent cohérents entre 0 et 100
 * (0/25/.../100), on les projette linéairement sur la plage Arc courante.
 */
export function reduceArcPercent(
  status: ArcInstallStatus,
  localPercent: number,
  range: [number, number] = DEFAULT_RANGES.arc
): number {
  const [min, max] = range
  if (status === 'done') return max
  return min + (clamp(localPercent, 0, 100) / 100) * (max - min)
}

/**
 * Construit le nouvel InstallState à partir d'un événement Java.
 * Pure function — testable isolément.
 */
export function applyJavaProgress(
  prev: InstallState,
  progress: JavaInstallProgress,
  ranges: InstallRanges = DEFAULT_RANGES
): InstallState {
  if (progress.status === 'done') {
    return {
      ...prev,
      phase: 'java',
      percent: ranges.java[1],
      label: JAVA_LABELS.done,
      sublabel: null,
      error: null,
    }
  }
  return {
    ...prev,
    active: true,
    phase: 'java',
    percent: reduceJavaPercent(progress.status, progress.percent, ranges.java),
    label: JAVA_LABELS[progress.status],
    sublabel: null,
    error: null,
  }
}

export function applyPackwizProgress(
  prev: InstallState,
  progress: PackwizInstallProgress,
  ranges: InstallRanges = DEFAULT_RANGES
): InstallState {
  if (progress.status === 'done') {
    return {
      ...prev,
      phase: 'packwiz',
      percent: ranges.packwiz[1],
      label: PACKWIZ_LABELS.done,
      sublabel: null,
      error: null,
    }
  }
  return {
    ...prev,
    active: true,
    phase: 'packwiz',
    percent: reducePackwizPercent(progress.status, progress.percent, ranges.packwiz),
    label: PACKWIZ_LABELS[progress.status],
    sublabel: null,
    error: null,
  }
}

export function applyArcProgress(
  prev: InstallState,
  progress: ArcInstallProgress,
  ranges: InstallRanges = DEFAULT_RANGES
): InstallState {
  if (progress.status === 'error') {
    return {
      ...prev,
      active: false,
      phase: null,
      percent: 0,
      label: ARC_LABELS.error,
      sublabel: null,
      error: progress.error ?? 'Erreur inconnue',
    }
  }
  if (progress.status === 'done') {
    return {
      ...prev,
      active: false,
      phase: null,
      percent: 100,
      label: ARC_LABELS.done,
      sublabel: null,
      error: null,
    }
  }
  const sublabel =
    progress.status === 'syncing_packwiz' && progress.modsDownloaded != null
      ? progress.modsTotal != null
        ? `Mods : ${progress.modsDownloaded}/${progress.modsTotal}`
        : `Mods : ${progress.modsDownloaded}`
      : null
  return {
    ...prev,
    active: true,
    phase: 'arc',
    percent: reduceArcPercent(progress.status, progress.percent, ranges.arc),
    label: ARC_LABELS[progress.status],
    sublabel,
    error: null,
  }
}

export function applyLaunchProgress(progress: LaunchProgress, prev: LaunchState): LaunchState {
  if (progress.status === 'error') {
    return {
      active: false,
      percent: 0,
      label: LAUNCH_LABELS.error,
      sublabel: null,
      error: progress.error ?? 'Erreur inconnue',
    }
  }
  if (progress.status === 'running' || progress.status === 'closed') {
    return {
      active: false,
      percent: 100,
      label: LAUNCH_LABELS[progress.status],
      sublabel: null,
      error: null,
    }
  }
  // Status actifs : le percent est piloté par l'asymptote temporelle, on
  // conserve donc prev.percent et on ne met à jour que le label.
  return {
    active: true,
    percent: prev.percent,
    label: LAUNCH_LABELS[progress.status],
    sublabel: null,
    error: null,
  }
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  install: INSTALL_IDLE,
  launch: LAUNCH_IDLE,
  _initialized: false,
  _seenJava: false,
  _seenPackwiz: false,
  _ranges: DEFAULT_RANGES,
  init: () => {
    if (get()._initialized) return
    set({ _initialized: true })

    window.electronAPI.onJavaInstallProgress((progress) => {
      const state = get()
      // Première event Java → Java est actif, recalcul des plages.
      const ranges = computeRanges(true, state._seenPackwiz)
      set({
        _seenJava: true,
        _ranges: ranges,
        install: applyJavaProgress(state.install, progress, ranges),
      })
    })

    window.electronAPI.onPackwizInstallProgress((progress) => {
      const state = get()
      // Première event Packwiz → Packwiz est actif. Si Java n'a pas été vu,
      // il est skippé et computeRanges redistribue la place.
      const ranges = computeRanges(state._seenJava, true)
      set({
        _seenPackwiz: true,
        _ranges: ranges,
        install: applyPackwizProgress(state.install, progress, ranges),
      })
    })

    window.electronAPI.onArcInstallProgress((progress) => {
      const state = get()
      // Si on arrive en Arc sans avoir vu Java/Packwiz, ils sont skippés :
      // computeRanges les marque vides et donne toute la place à Arc.
      const ranges = computeRanges(state._seenJava, state._seenPackwiz)
      set({
        _ranges: ranges,
        install: applyArcProgress(state.install, progress, ranges),
      })
    })

    window.electronAPI.onLaunchProgress((progress) => {
      // L'asymptote couvre tout le lancement (0 % → 98 %). On la démarre dès le
      // premier status actif et on l'arrête à l'arrivée d'un status terminal
      // (running = jeu démarré → percent forcé à 100, error, closed).
      const isTerminal =
        progress.status === 'running' || progress.status === 'closed' || progress.status === 'error'
      if (isTerminal) {
        stopLaunchAsymptote()
      } else {
        startLaunchAsymptote(set, get)
      }
      set({ launch: applyLaunchProgress(progress, get().launch) })
    })
  },
  startInstall: () =>
    set({
      install: INSTALL_PREPARING,
      _seenJava: false,
      _seenPackwiz: false,
      _ranges: DEFAULT_RANGES,
    }),
  resetInstall: () =>
    set({
      install: INSTALL_IDLE,
      _seenJava: false,
      _seenPackwiz: false,
      _ranges: DEFAULT_RANGES,
    }),
  resetLaunch: () => {
    stopLaunchAsymptote()
    set({ launch: LAUNCH_IDLE })
  },
}))
