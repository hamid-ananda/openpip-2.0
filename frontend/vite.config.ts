import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE ?? '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // Mol* ships skin CSS only in build/viewer; map the non-existent lib path
        // so that dynamic import('molstar/lib/mol-plugin-ui/skin/light.css') resolves
        // in test (and dev) without crashing vite:import-analysis.
        'molstar/lib/mol-plugin-ui/skin/light.css':
          'molstar/build/viewer/theme/light.css',
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: 'http://localhost:8001', changeOrigin: true },
        '/media': { target: 'http://localhost:8001', changeOrigin: true },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
