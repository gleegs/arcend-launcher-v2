import { shell as electronShell } from 'electron'
import { IpcChannels } from '../types/ipc'
import { arcendDir } from '../lib/paths'
import { safeHandle } from './utils'
import path from 'node:path'

export function registerShellIpc(): void {
  safeHandle(IpcChannels.SHELL_OPEN_PATH, async (pathArg: unknown) => {
    await electronShell.openPath(path.join(arcendDir, pathArg as string))
  })
}
