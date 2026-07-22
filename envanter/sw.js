// ===== Service Worker (PWA Offline Support) =====
const CACHE_NAME = 'envanter-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/database.js',
    '/js/barcode-scanner.js',
    '/js/usb-scanner.js',
    '/js/bluetooth-scanner.js',
    '/js/ocr-handler.js',
    '/js/excel-handler.js',
    '/js/sync-manager.js',
    '/js/app.js',
    '/manifest.json'
];

// CDN kaynaklari (cache'e alinmayacak)
const CDN_URLS = [
    'https://cdnjs.cloudflare.com',
    'https://unpkg.com'
];

// Install event - statik dosyalari cache'e al
self.addEventListener('install', (event) => {
    console.log('Service Worker: Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => console.log('Cache hatasi:', err))
    );
    self.skipWaiting();
});

// Activate event - eski cache'leri temizle
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - offline destegi
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // CDN kaynaklarini network-first stratejisi ile al
    if (CDN_URLS.some(cdn => url.href.includes(cdn))) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Basarili yanıti cache'e al
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Network basarisiz olursa cache'den al
                    return caches.match(request);
                })
        );
        return;
    }

    // API istekleri - network only (IndexedDB ile sync)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(request));
        return;
    }

    // Statik dosyalar - cache-first stratejisi
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Cache'den don, arka planda guncelle
                    fetch(request)
                        .then(networkResponse => {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(request, networkResponse.clone());
                            });
                        })
                        .catch(() => {});
                    return cachedResponse;
                }

                // Cache'de yoksa network'ten al
                return fetch(request)
                    .then(networkResponse => {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                        return networkResponse;
                    })
                    .catch(() => {
                        // Offline ve cache'de yoksa
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Background sync - offline islemleri senkronize et
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-products') {
        console.log('Service Worker: Background sync baslatildi');
        event.waitUntil(syncProducts());
    }
});

async function syncProducts() {
    // IndexedDB'den bekleyen islemleri al ve senkronize et
    // Bu kisim app.js'deki syncManager ile koordineli calisir
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'SYNC_REQUIRED' });
    });
}

// Push notifications (ileride eklenebilir)
self.addEventListener('push', (event) => {
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: 'assets/icon-192x192.png',
            badge: 'assets/icon-72x72.png'
        })
    );
});
