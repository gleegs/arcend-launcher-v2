import { ipcMain } from 'electron'
import type { IpcResult } from '../types/ipc'

export function safeHandle<T>(
  channel: string,
  handler: (...args: unknown[]) => Promise<T> | T
): void {
  ipcMain.handle(channel, async (_event, ...args: unknown[]) => {
    try {
      const data = await handler(...args)
      return { ok: true as const, data } satisfies IpcResult<T>
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : String(error),
      } satisfies IpcResult<T>
    }
  })
}
