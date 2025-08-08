// Secure Service Worker with proper authorization and input validation
const CACHE_NAME = 'focusmate-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Security utilities for service worker
const SecurityUtils = {
  sanitizeForLog: (input) => {
    if (typeof input !== 'string') {
      input = String(input);
    }
    return input
      .replace(/\r\n/g, '\\r\\n')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  },

  isValidOrigin: (origin) => {
    const allowedOrigins = [
      'https://focusmate-ai-8cad6.web.app',
      'https://focusmate-ai-8cad6.firebaseapp.com',
      'http://localhost:3000'
    ];
    return allowedOrigins.includes(origin);
  },

  validateRequest: (request) => {
    // Basic request validation
    if (!request || !request.url) {
      return false;
    }

    try {
      const url = new URL(request.url);
      // Only allow HTTPS in production
      if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Install event with proper error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened successfully');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', SecurityUtils.sanitizeForLog(error.message));
      })
  );
});

// Fetch event with authorization checks and input validation
self.addEventListener('fetch', (event) => {
  // Validate request
  if (!SecurityUtils.validateRequest(event.request)) {
    console.warn('Invalid request blocked:', SecurityUtils.sanitizeForLog(event.request.url));
    return;
  }

  // Check origin for cross-origin requests
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    if (!SecurityUtils.isValidOrigin(requestUrl.origin)) {
      console.warn('Cross-origin request blocked:', SecurityUtils.sanitizeForLog(requestUrl.origin));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        // Clone the request for security
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.error('Cache update failed:', SecurityUtils.sanitizeForLog(error.message));
              });

            return response;
          })
          .catch((error) => {
            console.error('Fetch failed:', SecurityUtils.sanitizeForLog(error.message));
            // Return offline fallback if available
            return caches.match('/offline.html') || new Response('Offline', { status: 503 });
          });
      })
  );
});

// Message event with origin verification
self.addEventListener('message', (event) => {
  // Verify origin of the message
  if (!SecurityUtils.isValidOrigin(event.origin)) {
    console.warn('Message from unauthorized origin blocked:', SecurityUtils.sanitizeForLog(event.origin));
    return;
  }

  // Validate message data
  if (!event.data || typeof event.data !== 'object') {
    console.warn('Invalid message data received');
    return;
  }

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_NAME });
      break;
    
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME)
        .then(() => {
          console.log('Cache cleared successfully');
          event.ports[0]?.postMessage({ success: true });
        })
        .catch((error) => {
          console.error('Cache clear failed:', SecurityUtils.sanitizeForLog(error.message));
          event.ports[0]?.postMessage({ success: false, error: error.message });
        });
      break;
    
    default:
      console.warn('Unknown message type:', SecurityUtils.sanitizeForLog(type));
  }
});

// Activate event with cleanup
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', SecurityUtils.sanitizeForLog(cacheName));
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated successfully');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Service Worker activation failed:', SecurityUtils.sanitizeForLog(error.message));
      })
  );
});

// Push event for notifications (with validation)
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('Push event received without data');
    return;
  }

  try {
    const data = event.data.json();
    
    // Validate notification data
    if (!data.title || typeof data.title !== 'string') {
      console.warn('Invalid notification title');
      return;
    }

    const options = {
      body: data.body || '',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'focusmate-notification',
      requireInteraction: false,
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Push notification failed:', SecurityUtils.sanitizeForLog(error.message));
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
      .catch((error) => {
        console.error('Failed to open window:', SecurityUtils.sanitizeForLog(error.message));
      })
  );
});