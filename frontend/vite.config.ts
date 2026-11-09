import { defineConfig, loadEnv, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// Preload the exact CSS emitted for the entry; no hardcoded content hashes.
function documentHead(publicOrigin: string): Plugin {
  return {
    name: 'systemiq-document-head',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]
        return {
          html: html.replaceAll('__PUBLIC_ORIGIN__', publicOrigin),
          tags: styles.map(([, href]) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'style', href, crossorigin: '' },
            injectTo: 'head' as const
          }))
        }
      }
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')
  const publicOrigin = new URL(env.VITE_SITE_URL || 'https://system-iq.vercel.app').origin
  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      documentHead(publicOrigin)
    ],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'react-runtime', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 50 },
              { name: 'motion-features', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 40, entriesAware: true },
              { name: 'reactflow', test: /node_modules[\\/](@reactflow[\\/]|reactflow[\\/])/, priority: 30, entriesAware: true },
              { name: 'recharts', test: /node_modules[\\/](recharts|victory-vendor)[\\/]/, priority: 20, entriesAware: true }
            ]
          }
        }
      }
    }
  }
})
