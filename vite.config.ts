import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = (
    env.DEV_API_PROXY_TARGET ||
    env.VITE_API_BASE_URL ||
    'http://localhost:5000'
  ).replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/v1': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    configureServer(server: ViteDevServer) {
      server.httpServer?.once('listening', () => {
        console.log(`[vite] API 代理目标: ${apiTarget}/api/v1`)
      })
    },
  }
})
