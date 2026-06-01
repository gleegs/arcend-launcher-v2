import { IpcChannels } from '../types/ipc'
import { launchGame, isGameRunning } from '../services/launcher'
import type { LaunchOptions } from '../types/launcher'
import { safeHandle } from './utils'

export function registerLauncherIpc(): void {
  safeHandle(IpcChannels.LAUNCH_GAME, (options: unknown) => launchGame(options as LaunchOptions))
  safeHandle(IpcChannels.LAUNCH_IS_RUNNING, () => isGameRunning())
}
