import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** 后台图表包不得进入用户端入口 modulepreload */
function isChartDep(dep: string) {
  return (
    dep.includes('echarts') ||
    dep.includes('recharts') ||
    dep.includes('/charts-') ||
    /(?:^|\/)charts-[^/]+\.js$/.test(dep)
  )
}

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
      modulePreload: {
        resolveDependencies: (_filename, deps) => deps.filter((dep) => !isChartDep(dep)),
      },
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
            // echarts / recharts 分开，避免进 Dashboard 就拖上热力图
            if (id.includes('node_modules/echarts')) {
              return 'echarts'
            }
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor')
            ) {
              return 'recharts'
            }
            // lucide 交给按图标 tree-shake，不强行打成 icons vendor
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
