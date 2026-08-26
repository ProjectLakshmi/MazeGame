import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

console.log('ALL ENV KEYS:', Object.keys(process.env).filter(k => k.startsWith('VITE_')))
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('VERCEL:', process.env.VERCEL, process.env.VERCEL_ENV)
export default defineConfig({
  
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'Maze Game',
        short_name: 'MazeGame',
        description: 'A fun maze puzzle game',
        theme_color: '#1e293b',
        background_color: '#ffffff',
        display: 'standalone',
         start_url: '/',
        scope: '/',
     icons: [
  {
    src: 'pwa-192x192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any'
  },
  {
    src: 'pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any'
  },
  {
    src: 'pwa-192x192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'maskable'
  },
  {
    src: 'pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable'
  }
]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})