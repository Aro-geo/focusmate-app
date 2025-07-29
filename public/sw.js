// Service Worker for FocusMate AI PWA
// Provides offline functionality and background sync

const CACHE_NAME = 'focusmate-ai-v1.0.0';
const OFFLINE_CACHE_NAME = 'focusmate-offline-v1.0.0';

// Resources to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/app/dashboard',
  '/app/pomodoro',
  '/app/journal',
  '/app/stats',
  '/app/profile',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  // Add other critical assets
];

// API endpoints that can work offline
const OFFLINE_API_ROUTES = [
  '/api/health',
  '/api/user/profile'
];

// Data that should be cached for offline access
const OFFLINE_DATA_KEYS = [
  'tasks',
  'pomodoro-sessions',
  'journal-entries',
  'user-preferences',
  'ai-insights'
];

self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📁 Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      
      // Initialize offline data storage
      initializeOfflineStorage()
    ])
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activated');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // API requests
      event.respondWith(handleApiRequest(request));
    } else if (url.pathname.startsWith('/static/') || STATIC_CACHE_URLS.includes(url.pathname)) {
      // Static resources
      event.respondWith(handleStaticRequest(request));
    } else {
      // App shell / navigation
      event.respondWith(handleNavigationRequest(request));
    }
  } else if (request.method === 'POST' && url.pathname.startsWith('/api/')) {
    // Handle POST requests for offline sync
    event.respondWith(handlePostRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === 'sync-pomodoro-sessions') {
    event.waitUntil(syncPomodoroSessions());
  } else if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

// Push notifications for productivity reminders
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  const options = {
    body: 'Time for a focus session! Your productivity awaits.',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: {
      url: '/app/pomodoro'
    },
    actions: [
      {
        action: 'start-session',
        title: 'Start Session'
      },
      {
        action: 'snooze',
        title: 'Remind me in 10 min'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('FocusMate AI', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'start-session') {
    event.waitUntil(
      clients.openWindow('/app/pomodoro')
    );
  } else if (event.action === 'snooze') {
    // Schedule another notification in 10 minutes
    scheduleNotification(10 * 60 * 1000, 'Ready for a focus session now?');
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/app/dashboard')
    );
  }
});

// Handle API requests with offline fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', url.pathname);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Provide offline fallback for specific endpoints
    return await provideOfflineFallback(url.pathname, request);
  }
}

// Handle static resource requests
async function handleStaticRequest(request) {
  // Cache first strategy for static resources
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log('📁 Static resource unavailable:', request.url);
    // Return a basic fallback for CSS/JS files
    return new Response('/* Offline fallback */', {
      headers: { 'Content-Type': 'text/css' }
    });
  }
}

// Handle navigation requests (app shell)
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('🧭 Navigation offline, serving app shell');
    
    // Serve cached app shell
    const cache = await caches.open(CACHE_NAME);
    return cache.match('/') || cache.match('/index.html');
  }
}

// Handle POST requests for offline queueing
async function handlePostRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('📤 POST request failed, queueing for sync');
    
    // Queue request for background sync
    await queueRequestForSync(request);
    
    // Return optimistic response
    return new Response(JSON.stringify({
      success: true,
      offline: true,
      message: 'Request queued for sync when online'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Provide offline fallbacks for specific API endpoints
async function provideOfflineFallback(pathname, request) {
  const db = await openIndexedDB();
  
  switch (pathname) {
    case '/api/tasks':
      const tasks = await getOfflineData(db, 'tasks');
      return jsonResponse(tasks || []);
      
    case '/api/pomodoro-sessions':
      const sessions = await getOfflineData(db, 'pomodoro-sessions');
      return jsonResponse(sessions || []);
      
    case '/api/journal-entries':
      const entries = await getOfflineData(db, 'journal-entries');
      return jsonResponse(entries || []);
      
    case '/api/user/profile':
      const profile = await getOfflineData(db, 'user-profile');
      return jsonResponse(profile || { name: 'Offline User', email: 'offline@focusmate.ai' });
      
    case '/api/health':
      return jsonResponse({
        success: true,
        message: 'Offline mode active',
        offline: true,
        timestamp: new Date().toISOString()
      });
      
    default:
      return new Response(JSON.stringify({
        success: false,
        offline: true,
        message: 'Endpoint not available offline'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// Initialize offline storage
async function initializeOfflineStorage() {
  const db = await openIndexedDB();
  console.log('💾 Offline storage initialized');
}

// Clean up old caches
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('focusmate-') && name !== CACHE_NAME && name !== OFFLINE_CACHE_NAME
  );
  
  await Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
  
  console.log('🧹 Cleaned up old caches:', oldCaches);
}

// Queue request for background sync
async function queueRequestForSync(request) {
  const db = await openIndexedDB();
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };
  
  const transaction = db.transaction(['sync-queue'], 'readwrite');
  const store = transaction.objectStore('sync-queue');
  await store.add(requestData);
  
  // Register background sync
  self.registration.sync.register('sync-offline-data');
}

// Sync offline data when back online
async function syncOfflineData() {
  console.log('🔄 Syncing offline data...');
  
  const db = await openIndexedDB();
  const transaction = db.transaction(['sync-queue'], 'readonly');
  const store = transaction.objectStore('sync-queue');
  const requests = await store.getAll();
  
  for (const requestData of requests) {
    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body
      });
      
      if (response.ok) {
        // Remove successfully synced request
        const deleteTransaction = db.transaction(['sync-queue'], 'readwrite');
        const deleteStore = deleteTransaction.objectStore('sync-queue');
        await deleteStore.delete(requestData.id);
      }
    } catch (error) {
      console.error('Failed to sync request:', error);
    }
  }
}

// Sync Pomodoro sessions
async function syncPomodoroSessions() {
  const db = await openIndexedDB();
  const sessions = await getOfflineData(db, 'pending-pomodoro-sessions');
  
  for (const session of sessions || []) {
    try {
      const response = await fetch('/api/pomodoro-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
      
      if (response.ok) {
        await removeOfflineData(db, 'pending-pomodoro-sessions', session.id);
      }
    } catch (error) {
      console.error('Failed to sync Pomodoro session:', error);
    }
  }
}

// Sync tasks
async function syncTasks() {
  const db = await openIndexedDB();
  const tasks = await getOfflineData(db, 'pending-tasks');
  
  for (const task of tasks || []) {
    try {
      const response = await fetch('/api/tasks', {
        method: task.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task.data)
      });
      
      if (response.ok) {
        await removeOfflineData(db, 'pending-tasks', task.id);
      }
    } catch (error) {
      console.error('Failed to sync task:', error);
    }
  }
}

// IndexedDB helpers
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FocusMateOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('sync-queue')) {
        const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp');
      }
      
      OFFLINE_DATA_KEYS.forEach(key => {
        if (!db.objectStoreNames.contains(key)) {
          db.createObjectStore(key, { keyPath: 'id', autoIncrement: true });
        }
      });
      
      if (!db.objectStoreNames.contains('pending-pomodoro-sessions')) {
        db.createObjectStore('pending-pomodoro-sessions', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pending-tasks')) {
        db.createObjectStore('pending-tasks', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function getOfflineData(db, storeName) {
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  return await store.getAll();
}

async function setOfflineData(db, storeName, data) {
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  return await store.put(data);
}

async function removeOfflineData(db, storeName, id) {
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  return await store.delete(id);
}

// Utility functions
function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function scheduleNotification(delay, message) {
  setTimeout(() => {
    self.registration.showNotification('FocusMate AI', {
      body: message,
      icon: '/logo192.png',
      badge: '/logo192.png'
    });
  }, delay);
}

console.log('🚀 FocusMate AI Service Worker loaded and ready!');
