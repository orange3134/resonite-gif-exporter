import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/assets-proxy': {
        target: 'https://assets.resonite.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/assets-proxy/, '')
      }
    }
  }
})
