/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module '*.css' {
  const content: string
  export default content
}

import type { ElectronApi } from './electron/types/ipc'

declare global {
  const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
  const MAIN_WINDOW_VITE_NAME: string

  interface Window {
    electronAPI: ElectronApi
  }
}

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag'
  }
}

export {}
