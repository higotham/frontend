import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
      host: true,
  },
  resolve: {
      alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
          '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
          '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
          '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
          '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
          '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      }
  },
})
