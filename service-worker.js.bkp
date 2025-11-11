/**
 * Service Worker for NEXEFII PWA
 * Provides offline-first capabilities and intelligent caching
 * 
 * Features:
 * - Offline fallback for core pages
 * - Asset caching (CSS, JS, images)
 * - Network-first strategy for API calls
 * - Cache-first strategy for static assets
 * - Background sync for data operations
 * 
 * @version 1.0.2
 * @date 2025-11-09
 */

// Bumped version to force update after routing & asset changes
const CACHE_VERSION = 'nexefii-v1.0.4';
const CACHE_NAME = `nexefii-cache-${CACHE_VERSION}`;

// Assets to cache on install (critical for offline functionality)
// Minimal viable offline/core assets (removed missing/legacy files)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/shell.html',
  '/manifest.json',
  '/style.css',
  '/css/property-dashboard.css',
  '/css/property-dashboard-pms.css',
  '/nexefii-auth.js',
  '/properties.js',
  '/app.js',
  '/demo-data-generator.js',
  '/property-dashboard-manager.js',
  '/pms-modules.js',
  '/core/router/Router.js',
  '/core/database/PropertyDatabase.js',
  '/core/i18n/I18nManager.js',
  '/pwa-installer.js',
  '/assets/Nexefii_logo_3d-official.png',
  '/assets/images/default-hotel-1.jpg',
  '/assets/images/default-hotel-2.jpg',
  '/assets/images/default-hotel-3.jpg',
  '/assets/images/default-hotel-4.jpg',
  '/assets/images/default-hotel-5.jpg',
  '/assets/images/default-hotel-6.jpg',
  '/offline.html'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[Service Worker] Caching core assets (continue on individual failures)');
        const results = await Promise.all(
          CORE_ASSETS.map(async (url) => {
            try {
              await cache.add(url);
              return { url, ok: true };
            } catch (error) {
              console.warn('[Service Worker] Failed to cache core asset:', url, error);
              return { url, ok: false, error };
            }
          })
        );
        const failed = results.filter(r => !r.ok);
        if (failed.length) {
          console.warn(`[Service Worker] ${failed.length} core assets failed to cache`, failed.map(f => f.url));
        }
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches
              return cacheName.startsWith('nexefii-cache-') && cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Network-first strategy for HTML pages (always get fresh content)
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache and return
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // No cache, return offline page
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // Cache-first strategy for assets (CSS, JS, images, fonts)
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith((async () => {
      try {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Try network
        const response = await fetch(request);
        try {
          if (response && (response.ok || response.type === 'opaque')) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
          }
        } catch (e) { /* cache put best-effort */ }
        return response;
      } catch (err) {
        console.warn('[Service Worker] Asset fetch failed, retrying (reload):', request.url, err);
        try {
          const retry = await fetch(new Request(request, { cache: 'reload' }));
          return retry;
        } catch (err2) {
          console.error('[Service Worker] Asset fetch failed after retry:', request.url, err2);
          // Fallback to any cached copy if present
          const fallback = await caches.match(request);
          if (fallback) return fallback;
          // Let the browser treat as a normal failure instead of custom 408
          return Response.error();
        }
      }
    })());
    return;
  }
  
  // Network-first for everything else (API calls, JSON, etc.)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache as fallback
        return caches.match(request);
      })
  );
});

// Background Sync (for offline data operations)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-property-data') {
    event.waitUntil(
      // Sync logic will be implemented when backend is ready
      Promise.resolve()
        .then(() => {
          console.log('[Service Worker] Property data synced');
        })
        .catch((error) => {
          console.error('[Service Worker] Sync failed:', error);
          throw error; // Retry sync
        })
    );
  }
});

// Push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/assets/Nexefii_logo_3d-official.png',
    badge: '/assets/Nexefii_logo_3d-official.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('NEXEFII', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler (for communication with main thread)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[Service Worker] Cache cleared');
      })
    );
  }
});

console.log('[Service Worker] Loaded v' + CACHE_VERSION);
