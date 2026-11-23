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
