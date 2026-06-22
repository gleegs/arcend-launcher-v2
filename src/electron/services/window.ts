import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { getConfig, setConfig } from './store'
import type { WindowBounds } from '../types/ipc'

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function createMainWindow(): BrowserWindow {
  const bounds = getConfig('windowBounds')

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: true,
    resizable: false,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  mainWindow.on('moved', saveWindowBounds)
  mainWindow.on('resized', saveWindowBounds)
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return
      const key = input.key.toLowerCase()
      const isDevToolsShortcut =
        key === 'f12' ||
        ((input.control || input.meta) && input.shift && key === 'i') ||
        ((input.control || input.meta) && input.alt && key === 'i') ||
        ((input.control || input.meta) && input.shift && key === 'j') ||
        ((input.control || input.meta) && input.alt && key === 'j') ||
        ((input.control || input.meta) && input.shift && key === 'c') ||
        ((input.control || input.meta) && input.alt && key === 'c')
      if (isDevToolsShortcut) {
        event.preventDefault()
      }
    })
  }

  return mainWindow
}

function saveWindowBounds(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const [x, y] = mainWindow.getPosition()
  const [width, height] = mainWindow.getSize()
  const bounds: WindowBounds = { x, y, width, height }
  setConfig('windowBounds', bounds)
}

export function minimizeWindow(): void {
  mainWindow?.minimize()
}

export function maximizeWindow(): void {
  if (!mainWindow) return
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
}

export function closeWindow(): void {
  mainWindow?.close()
}

export function hideWindow(): void {
  mainWindow?.hide()
}

export function restoreWindow(): void {
  if (!mainWindow) return
  mainWindow.show()
  mainWindow.focus()
}

export function getWindowPosition(): { x: number; y: number } {
  if (!mainWindow || mainWindow.isDestroyed()) return { x: 0, y: 0 }
  const [x, y] = mainWindow.getPosition()
  return { x, y }
}

export function setWindowPosition(x: number, y: number): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.setPosition(Math.round(x), Math.round(y))
}
