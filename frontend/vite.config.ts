import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// proxy keys are regexes scoped to API sub-paths so that full-page reloads on
// SPA routes like /box1 or /dashboard still serve index.html
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 6555,
    strictPort: true,
    proxy: {
      '^/dashboard/.+': 'http://localhost:8010',
      '^/box1/.+': 'http://localhost:8010',
      '^/box2/.+': 'http://localhost:8010',
      '^/box3/.+': 'http://localhost:8010',
      '^/box4/.+': 'http://localhost:8010',
      '^/box5/.+': 'http://localhost:8010',
      '^/annexure/.+': 'http://localhost:8010',
      '^/comms/.+': 'http://localhost:8010',
      '^/consolidation/.+': 'http://localhost:8010',
      '^/tracker/.+': 'http://localhost:8010',
      '^/setup$': 'http://localhost:8010',
    },
  },
})
