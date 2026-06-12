import { shell as electronShell } from 'electron'
import { IpcChannels } from '../types/ipc'
import { arcendDir } from '../lib/paths'
import { safeHandle } from './utils'

export function registerShellIpc(): void {
  safeHandle(IpcChannels.SHELL_OPEN_PATH, async (path: unknown) => {
    await electronShell.openPath((path as string) || arcendDir)
  })
}
