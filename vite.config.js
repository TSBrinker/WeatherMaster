import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git commit hash at build time
let gitCommitHash = 'dev'
try {
  gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch (e) {
  // Git not available, use fallback
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/WeatherMaster/',
  define: {
    __APP_VERSION__: JSON.stringify(gitCommitHash),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build'
  }
})
