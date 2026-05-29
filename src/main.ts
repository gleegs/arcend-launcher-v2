import { app, BrowserWindow } from 'electron'
import started from 'electron-squirrel-startup'
import { initStore } from './electron/services/store'
import { createMainWindow, getMainWindow } from './electron/services/window'
import { registerAllIpcHandlers } from './electron/ipc'
import { refresh as refreshAuth } from './electron/services/auth'

if (started) {
  app.quit()
}

app.on('ready', () => {
  initStore()
  registerAllIpcHandlers()
  createMainWindow()

  refreshAuth().catch(() => undefined)
})

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') return
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.hide()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
