import { defineConfig } from 'vite'
import { resolve } from 'path'

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:3001'

export default defineConfig({
  root: 'src/frontend',

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
    __APP_ENV__: JSON.stringify(process.env.NODE_ENV || 'development'),
    __ENABLE_METRICS__: JSON.stringify(process.env.VITE_ENABLE_METRICS === 'true')
  },

  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  },

  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/frontend/index.html'),
        adotar: resolve(__dirname, 'src/frontend/pages/adotar/index.html'),
        adotados: resolve(__dirname, 'src/frontend/pages/adotados/index.html'),
        ajudar: resolve(__dirname, 'src/frontend/pages/ajudar/index.html'),
        admin: resolve(__dirname, 'src/frontend/pages/admin/index.html')
      },
      output: {
        manualChunks: {
          vendor: ['src/frontend/js/core/App.js']
        }
      }
    },
    sourcemap: process.env.NODE_ENV !== 'production'
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ''
      }
    }
  }
})
