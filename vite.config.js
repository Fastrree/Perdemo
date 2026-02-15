import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/ai': {
          target: 'http://127.0.0.1:8045',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai/, '/v1'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_AI_API_KEY}`)
            })
          },
        },
      },
    },
  }
})
