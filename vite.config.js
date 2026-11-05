import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE: '/organizador-facultad-colman/' para GitHub Pages, '/' para Render/local.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
