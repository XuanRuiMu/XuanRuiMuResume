import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'node:path'
import fs from 'node:fs'

const isAnalyze = process.env.ANALYZE === 'true'

function inlineCriticalCSS() {
  return {
    name: 'inline-critical-css',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const criticalPath = path.resolve(__dirname, './src/styles/critical.css')
        if (!fs.existsSync(criticalPath)) {
          return html
        }
        const css = fs.readFileSync(criticalPath, 'utf-8')
        return html.replace('<!-- CRITICAL_CSS -->', `<style>${css.replace(/\s+/g, ' ').trim()}</style>`)
      },
    },
  }
}

function preloadCSSPlugin() {
  return {
    name: 'preload-css',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const stylesheetMatch = html.match(/<link[^>]+rel="stylesheet"[^>]+href="(\/assets\/index-[^"]+\.css)"[^>]*>/)
        if (!stylesheetMatch) {
          return html
        }
        const cssHref = stylesheetMatch[1]
        const preloadLink = `<link rel="preload" href="${cssHref}" as="style" crossorigin />`
        return html.replace(stylesheetMatch[0], `${preloadLink}\n    ${stylesheetMatch[0]}`)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    inlineCriticalCSS(),
    preloadCSSPlugin(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,json,woff,woff2}'],
        globIgnores: ['**/*.map', '**/sw.js'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
    isAnalyze &&
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: './dist/report.html',
      }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5180,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (['/react/', '/react-dom/', '/scheduler/'].some((prefix) => id.includes(prefix))) {
            return 'react-vendor'
          }
          if (['/three/', '/@react-three/'].some((prefix) => id.includes(prefix))) {
            return 'three-vendor'
          }
          if (id.includes('/framer-motion/')) return 'animation-vendor'
          if (id.includes('/recharts/')) return 'charts-vendor'
          if (
            [
              '/lucide-react/',
              '/zustand/',
              '/cmdk/',
              '/@radix-ui/',
              '/react-dialog/',
              '/react-dismissable-layer/',
              '/tailwind-merge/',
            ].some((prefix) => id.includes(prefix))
          ) {
            return 'ui-vendor'
          }
          if (['/ai/', '/zod/', '/to-json-schema/'].some((prefix) => id.includes(prefix))) {
            return 'ai-vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1400,
  },
  optimizeDeps: {
    include: ['zustand'],
  },
})
