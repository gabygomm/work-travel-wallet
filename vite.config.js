import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/work-travel-wallet/',
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Work & Travel Wallet',
      short_name: 'WT Wallet',
      description: 'Control financiero para tu Work and Travel',
      start_url: '/work-travel-wallet/',
      scope: '/work-travel-wallet/',
      display: 'standalone',
      background_color: '#edf4fb',
      theme_color: '#113250',
      icons: [
        {src:'pwa-192x192.png',sizes:'192x192',type:'image/png'},
        {src:'pwa-512x512.png',sizes:'512x512',type:'image/png'},
        {src:'pwa-512x512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
      ]
    }
  })]
}))
