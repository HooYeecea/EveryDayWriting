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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/react/')
            ) {
              return 'react-vendor'
            }
            if (
              id.includes('@tiptap') ||
              id.includes('prosemirror') ||
              id.includes('node_modules/orderedmap') ||
              id.includes('node_modules/markdown-it')
            ) {
              return 'editor'
            }
            if (
              id.includes('node_modules/echarts') ||
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor')
            ) {
              return 'charts'
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'icons'
            }
          },
        },
      },
    },
    server: {
      proxy: {
        '/api/v1': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
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
