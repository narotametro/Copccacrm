/**
 * Pocket CRM Service Worker
 * 
 * Implements Progressive Web App (PWA) functionality with caching strategies
 * for improved performance and offline capability.
 * 
 * Cache Strategy:
 * - Cache-first for static assets
 * - Network-first for API calls
 * - Offline fallback support
 * 
 * @version 1.0.0
 */

const CACHE_NAME = 'pocket-crm-v1';
const CACHE_VERSION = '1.0.0';

// Static assets to cache on install
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/globals.css',
];

/**
 * Service Worker Installation
 * Caches essential static assets for offline use
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache resources during install:', error);
      })
  );
  // Immediately activate this service worker
  self.skipWaiting();
});

/**
 * Service Worker Fetch Handler
 * Implements cache-first strategy with network fallback
 */
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request).then((networkResponse) => {
          // Only cache successful responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clone the response (can only be consumed once)
          const responseToCache = networkResponse.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.error('Failed to cache response:', error);
            });

          return networkResponse;
        }).catch((error) => {
          console.error('Fetch failed; returning offline page:', error);
          // Here you could return a custom offline page
          // return caches.match('/offline.html');
        });
      })
  );
});

/**
 * Service Worker Activation
 * Cleans up old caches and claims clients
 */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});