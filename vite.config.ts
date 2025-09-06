import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import path from 'path'
import manifest from './public/manifest.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  
  return {
    plugins: [
      react({
        // Enable React DevTools and better error boundaries in development
        babel: isDev ? {
          plugins: [
            // Add development plugins for better debugging
          ]
        } : undefined,
      }),
      crx({ manifest })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/stores': path.resolve(__dirname, './src/stores'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/config': path.resolve(__dirname, './src/config'),
        '@/styles': path.resolve(__dirname, './src/styles'),
        '@/locales': path.resolve(__dirname, './src/locales'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
      // Disable minification in development for better error messages
      minify: isDev ? false : 'esbuild',
      // Generate source maps for better debugging
      sourcemap: isDev ? 'inline' : false,
      // Preserve debug information in development
      rollupOptions: isDev ? {
        output: {
          // Keep function names for better stack traces
          minifyInternalExports: false,
        }
      } : undefined,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode || 'development'),
      // Enable React strict mode and dev tools
      '__DEV__': JSON.stringify(isDev),
    },
    // Enable better error overlay in development
    server: isDev ? {
      hmr: {
        overlay: true
      }
    } : undefined,
    // Optimize dev build for better debugging
    esbuild: isDev ? {
      keepNames: true,
      sourcemap: true,
    } : undefined,
  }
})
