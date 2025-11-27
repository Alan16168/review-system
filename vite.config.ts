import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build({
      exclude: [
        '/diagnostic.html',
        '/debug.html',
        '/favicon.ico',
        '/marketplace-admin.html',
        '/my-documents.html',
        '/static/*'
      ]
    }),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})
