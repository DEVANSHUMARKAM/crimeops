import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Geo-Smart City: Urban Intelligence',
        short_name: 'GeoSmart',
        description: 'Predictive Crime, AQI, and Urbanization Dashboard for Nagpur',
        theme_color: '#1a1a1a', // Set to match your dashboard theme
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // This ensures your app caches your static assets for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});