const CACHE_NAME = 'pixel-tools-v1';

const PRECACHE_URLS = [
  './index.html',
  './styles/pixel.css',
  './js/app.js',
  './js/pixel-art.js',
  './js/function-plotter.js',
  './js/predictors.js',
  './js/chart.js',
  './js/weights.js',
  './js/nn.js',
  './js/funcfit.js',
  './js/overfit.js',
  './js/offsetfit.js',
  'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(function() {
        return self.skipWaiting();
      })
      .catch(function(err) {
        console.error('Precache failed:', err);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then(function(cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(function(networkResponse) {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          try {
            cache.put(request, responseToCache);
          } catch (e) {
            console.error('Cache put failed:', e);
          }
        });

        return networkResponse;
      }).catch(function() {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        throw new Error('Network request failed');
      });
    })
  );
});
