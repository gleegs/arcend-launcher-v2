import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load .env files (including non VITE_-prefixed vars) into a local object.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    define: {
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.SUPABASE_PUBLISHABLE_KEY),
    },
  }
})
