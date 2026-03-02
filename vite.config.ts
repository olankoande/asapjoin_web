import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'AsapJoin - Covoiturage',
        short_name: 'AsapJoin',
        description: 'Plateforme de covoiturage et livraison de colis',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/trips\/search/,
            handler: 'NetworkFirst',
            options: { cacheName: 'trips-search', expiration: { maxEntries: 50, maxAgeSeconds: 300 } },
          },
          {
            urlPattern: /\/api\/v1\/trips\/[^/]+$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'trip-details', expiration: { maxEntries: 100, maxAgeSeconds: 600 } },
          },
          {
            urlPattern: /\/api\/v1\/me\/wallet/,
            handler: 'NetworkFirst',
            options: { cacheName: 'wallet', expiration: { maxEntries: 5, maxAgeSeconds: 120 } },
          },
          {
            urlPattern: /\/api\/v1\/conversations/,
            handler: 'NetworkFirst',
            options: { cacheName: 'messages', expiration: { maxEntries: 50, maxAgeSeconds: 60 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
