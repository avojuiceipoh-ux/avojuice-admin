import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api-proxy': {
        target: 'https://avojuice-backend-production.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
      },
      '/uploads': {
        target: 'https://avojuice-backend-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})
