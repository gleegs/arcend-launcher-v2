import { registerWindowIpc } from './window.ipc'
import { registerStoreIpc } from './store.ipc'
import { registerAuthIpc } from './auth.ipc'
import { registerJavaIpc } from './java.ipc'
import { registerPackwizIpc } from './packwiz.ipc'
import { registerArcIpc } from './arc.ipc'
import { registerLauncherIpc } from './launcher.ipc'

export function registerAllIpcHandlers(): void {
  registerWindowIpc()
  registerStoreIpc()
  registerAuthIpc()
  registerJavaIpc()
  registerPackwizIpc()
  registerArcIpc()
  registerLauncherIpc()
}
