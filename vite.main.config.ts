import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
    'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY),
    'process.env.SERVER_HOST': JSON.stringify(process.env.SERVER_HOST),
  },
})
