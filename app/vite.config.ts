import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { catalogPlugin } from './scripts/catalog-plugin.js'

// Project page en GitHub Pages: https://<user>.github.io/Atlas/
export default defineConfig({
  base: '/Atlas/',
  plugins: [
    react(),
    catalogPlugin({
      contenidosRoot: path.resolve(__dirname, '../contenidos'),
      out: path.resolve(__dirname, 'src/generated/catalog.json'),
    }),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
    // Dev proxy — target overridable via VITE_DEV_API_TARGET
    // (defaults to Express server on 3001; set to http://localhost:8787 to use the Worker).
    proxy: {
      '/api': { target: process.env.VITE_DEV_API_TARGET ?? 'http://localhost:3001', changeOrigin: true },
    },
  },
  resolve: {
    preserveSymlinks: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: true,
      },
    },
  },
})
