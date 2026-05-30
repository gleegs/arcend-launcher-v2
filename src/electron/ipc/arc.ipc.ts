import { ipcMain } from 'electron'
import { IpcChannels } from '../types/ipc'
import {
  getInstalledArcs,
  installArc,
  uninstallArc,
  isInstalled,
  getArcPath,
} from '../services/arc'
import type { ArcMetadata } from '../types/arc'

export function registerArcIpc(): void {
  ipcMain.handle(IpcChannels.ARC_GET_REGISTRY, () => getInstalledArcs())

  ipcMain.handle(IpcChannels.ARC_INSTALL, (_event, arcId: string, metadata: ArcMetadata) =>
    installArc(arcId, metadata)
  )

  ipcMain.handle(IpcChannels.ARC_UNINSTALL, (_event, arcId: string) => uninstallArc(arcId))

  ipcMain.handle(IpcChannels.ARC_IS_INSTALLED, (_event, arcId: string) => isInstalled(arcId))

  ipcMain.handle(IpcChannels.ARC_GET_PATH, (_event, arcId: string) => getArcPath(arcId))
}
