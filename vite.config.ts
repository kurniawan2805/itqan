import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Itqan',
        short_name: 'Itqan',
        description: 'Offline-first tahfidz assistant with QuranWBW Mushaf data.',
        theme_color: '#064e3b',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/static\.quranwbw\.com\/data\/v4\/.*$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'quranwbw-static-data',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /^https:\/\/(www\.)?everyayah\.com\/.*\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-verse-audio',
              expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 180 }
            }
          },
          {
            urlPattern: /^https:\/\/audios\.quranwbw\.com\/words\/.*\.mp3/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-word-audio',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 180 }
            }
          }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  }
});
