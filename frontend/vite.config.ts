import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// proxy keys are regexes scoped to API sub-paths so that full-page reloads on
// SPA routes like /box1 or /dashboard still serve index.html
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      '^/dashboard/.+': 'http://localhost:8000',
      '^/box1/.+': 'http://localhost:8000',
      '^/box2/.+': 'http://localhost:8000',
      '^/box3/.+': 'http://localhost:8000',
      '^/box4/.+': 'http://localhost:8000',
      '^/box5/.+': 'http://localhost:8000',
      '^/annexure/.+': 'http://localhost:8000',
      '^/comms/.+': 'http://localhost:8000',
      '^/setup$': 'http://localhost:8000',
    },
  },
})
