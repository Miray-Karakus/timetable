import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firebase-firestore', test: /node_modules[/\\]@firebase[/\\]firestore[/\\]/, priority: 30 },
            { name: 'firebase', test: /node_modules[/\\](@firebase|firebase)[/\\]/, priority: 20 },
            { name: 'react-vendor', test: /node_modules[/\\](react|react-dom|scheduler)[/\\]/, priority: 10 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
