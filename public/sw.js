const CACHE_NAME = 'fleet-tracker-v2';
const urlsToCache = [
  '/',
  '/drivers',
  '/vehicles',
  '/maintenance',
  '/cleanliness',
  '/reports',
  '/weekly-check',
  '/log',
  '/globals.css',
  '/images/browns-logo.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline, but require network for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For API calls, always try network first and show offline message if failed
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return a response indicating offline for API calls
          return new Response(
            JSON.stringify({ 
              error: 'No internet connection. Please check your connection and try again.',
              offline: true 
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(request)
          .catch(() => {
            // If it's a page request and we're offline, show a basic offline page
            if (request.headers.get('accept').includes('text/html')) {
              return new Response(
                `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Offline - Fleet Tracker</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      text-align: center; 
                      padding: 50px; 
                      background: linear-gradient(135deg, #1a1a2e, #16213e);
                      color: white;
                      margin: 0;
                      min-height: 100vh;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                    }
                    .offline-container {
                      max-width: 400px;
                      margin: 0 auto;
                    }
                    .icon { font-size: 4rem; margin-bottom: 1rem; }
                    h1 { margin-bottom: 1rem; }
                    p { color: #ccc; line-height: 1.6; }
                    .retry-btn {
                      background: #4CAF50;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 6px;
                      font-size: 16px;
                      cursor: pointer;
                      margin-top: 20px;
                    }
                    .retry-btn:hover { background: #45a049; }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <div class="icon">📡</div>
                    <h1>No Internet Connection</h1>
                    <p>Fleet Tracker requires an internet connection to ensure all submissions are properly saved to the server.</p>
                    <p>Please check your connection and try again.</p>
                    <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
                  </div>
                </body>
                </html>
                `,
                {
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
