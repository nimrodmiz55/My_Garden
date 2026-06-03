import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' = don't auto-activate the waiting SW; let the UI decide when to swap
      registerType: 'prompt',
      // Keep using the existing public/manifest.json — no need to duplicate it here
      manifest: false,
      workbox: {
        // Cache all built assets so the app works offline and updates atomically
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Remove caches from previous SW versions when the new one activates
        cleanupOutdatedCaches: true,
        // After skipWaiting(), immediately control all open tabs so the reload
        // lands on the new version instead of being served by the old SW
        clientsClaim: true,
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
