import { ipcMain } from 'electron'
import { IpcChannels } from '../types/ipc'
import { launchGame, isGameRunning } from '../services/launcher'
import type { LaunchOptions } from '../types/launcher'

export function registerLauncherIpc(): void {
  ipcMain.handle(IpcChannels.LAUNCH_GAME, (_event, options: LaunchOptions) => launchGame(options))
  ipcMain.handle(IpcChannels.LAUNCH_IS_RUNNING, () => isGameRunning())
}
