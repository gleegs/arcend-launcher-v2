import { registerWindowIpc } from './window.ipc'
import { registerStoreIpc } from './store.ipc'

export function registerAllIpcHandlers(): void {
  registerWindowIpc()
  registerStoreIpc()
}
