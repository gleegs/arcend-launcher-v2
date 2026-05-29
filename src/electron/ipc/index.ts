import { registerWindowIpc } from './window.ipc'
import { registerStoreIpc } from './store.ipc'
import { registerAuthIpc } from './auth.ipc'

export function registerAllIpcHandlers(): void {
  registerWindowIpc()
  registerStoreIpc()
  registerAuthIpc()
}
