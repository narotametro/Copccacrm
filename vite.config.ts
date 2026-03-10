import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Generate unique build timestamp for cache busting
const buildTimestamp = Date.now().toString();

// Updated base path for custom domain deployment
export default defineConfig({
  base: '/',
  define: {
    'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(buildTimestamp)
  },
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
    // Force cache bust by injecting timestamp into HTML
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `  <meta name="build-timestamp" content="${buildTimestamp}">\n  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">\n  </head>`
        );
      }
    },
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
        skipWaiting: false, // Let user trigger update (prevents claim error)
        clientsClaim: false, // Prevent automatic claim on activation
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        
        // CRITICAL: Only cache static assets, NEVER cache JS/CSS chunks
        globPatterns: ['**/*.{html,ico,png,svg,woff2}'],
        
        // Exclude ALL hashed JS/CSS from precaching (prevent 404 on old files)
        globIgnores: ['**/assets/**/*.js', '**/assets/**/*.css'],
        
        // SPA fallback - serve index.html for navigation requests
        navigateFallback: '/index.html',
        
        // CRITICAL: Prevent service worker from intercepting asset requests
        navigateFallbackDenylist: [
          /\.(?:js|css|map|json|txt|xml|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico)$/i,
          /^\/api\//,
          /^\/__/,
          /\/assets\//  // Never intercept asset folder
        ],
        
        // Ignore ALL URL parameters
        ignoreURLParametersMatching: [/.*/],
        
        runtimeCaching: [
          // JS/CSS: NetworkOnly (NEVER cache - always fetch fresh)
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'NetworkOnly', // Changed from NetworkFirst to NetworkOnly
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
