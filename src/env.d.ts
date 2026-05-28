/// <reference types="vite/client" />

declare module '*.css' {
  const content: string
  export default content
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string
