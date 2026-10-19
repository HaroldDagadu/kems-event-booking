import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false,
      // Reduce HMR frequency to prevent excessive refreshes
      timeout: 30000
    },
    watch: {
      usePolling: false,
      interval: 2000, // Increased interval to reduce file watching frequency
      // Ignore certain files that might cause unnecessary refreshes
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
}) 