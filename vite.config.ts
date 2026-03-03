import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Updated base path for custom domain deployment
export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only split critical React libs to prevent useState issues
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router-vendor';
          }
          // Everything else in default chunks (let Vite decide)
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    // Remove console.log in production (keep console.error and console.warn for debugging)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: ['log'], // Only remove console.log, keep error/warn/info
        drop_debugger: true,
        pure_funcs: ['console.log'] // Extra safety to ensure console.log is removed
      }
    },
    // Ensure proper module resolution
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      devOptions: {
        enabled: false
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'COPCCA CRM',
        short_name: 'COPCCA',
        theme_color: '#0047ab',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        // Only cache essential static files
        globPatterns: ['**/*.{html,ico,png,svg,woff2}'],
        // SPA fallback - serve index.html for navigation requests
        navigateFallback: '/index.html',
        // Only apply fallback to actual navigation, exclude assets and API calls
        navigateFallbackDenylist: [
          /\.(?:js|css|map|json|txt|xml|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico)$/i,
          /^\/api\//,
          /^\/__/
        ],
        // Ignore URL parameters for caching
        ignoreURLParametersMatching: [/.*/],
        runtimeCaching: [
          // JS/CSS chunks: Network-first to always get latest after deployment
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'js-css-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Supabase API: Network-first for fresh data
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Images: Cache-first (don't change often)
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5174,
    strictPort: false,
    open: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
