import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    preTransformRequests: false,
    watch: null,
  },
  // Avoid hung esbuild dep crawler (was leaving deps_temp and freezing requests)
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
})
