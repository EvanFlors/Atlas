import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
