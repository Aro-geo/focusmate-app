// PWA Service Worker Registration and Management
// Handles installation, updates, and offline functionality

interface PWAInstallEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private isOnline = navigator.onLine;
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  constructor() {
    this.init();
  }

  /**
   * Initialize PWA service
   */
  private async init() {
    if ('serviceWorker' in navigator) {
      try {
        // Register service worker
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('✅ Service Worker registered successfully:', this.registration);

        // Handle service worker updates
        this.handleServiceWorkerUpdates();

        // Listen for installation events
        this.handleInstallPrompt();

        // Monitor online/offline status
        this.handleOnlineStatus();

        // Check if app is already installed
        this.checkInstallationStatus();

        // Request persistent storage
        this.requestPersistentStorage();

        // Setup push notifications
        this.setupPushNotifications();

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    } else {
      console.warn('⚠️ Service Workers are not supported in this browser');
    }
  }

  /**
   * Handle service worker updates
   */
  private handleServiceWorkerUpdates() {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New app version available');
            this.updateAvailable = true;
            this.notifyUpdateAvailable();
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('💾 Cache updated:', event.data.payload);
      }
    });
  }

  /**
   * Handle installation prompt
   */
  private handleInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.deferredPrompt = null;
      
      // Track installation
      this.trackInstallation();
    });
  }

  /**
   * Handle online/offline status
   */
  private handleOnlineStatus() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online');
      this.isOnline = true;
      this.notifyOnlineStatus(true);
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Gone offline');
      this.isOnline = false;
      this.notifyOnlineStatus(false);
    });
  }

  /**
   * Check if app is already installed
   */
  private checkInstallationStatus() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('📱 Running as installed PWA');
    }

    // Check for iOS Safari standalone mode
    if ((navigator as any).standalone) {
      this.isInstalled = true;
      console.log('📱 Running as iOS PWA');
    }
  }

  /**
   * Request persistent storage
   */
  private async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log(`💾 Persistent storage: ${persistent ? 'granted' : 'denied'}`);
      } catch (error) {
        console.error('Failed to request persistent storage:', error);
      }
    }
  }

  /**
   * Setup push notifications
   */
  private async setupPushNotifications() {
    if (!('Notification' in window) || !this.registration) {
      console.warn('⚠️ Push notifications not supported');
      return;
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log(`🔔 Notification permission: ${permission}`);
    }

    if (Notification.permission === 'granted') {
      try {
        // Wait for service worker to be active
        if (this.registration.active) {
          // Subscribe to push notifications
          const subscription = await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(
              process.env.REACT_APP_VAPID_PUBLIC_KEY || 'BMxZWXr5G_UjqY8CKQBB4P7RhHpw_8YJnJ_5g9z2Qz_xPzJQXr5GKQBB4P7RhHpw'
            )
          });

        console.log('🔔 Push subscription created');
        
        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);
        } else {
          console.log('⏳ Service worker not active yet, skipping push subscription');
        }
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        // Don't throw error, just log it as push notifications are optional
      }
    }
  }

  /**
   * Show install button/prompt
   */
  private showInstallButton() {
    // Dispatch custom event for UI components to listen to
    window.dispatchEvent(new CustomEvent('pwa-install-available', {
      detail: { canInstall: true }
    }));
  }

  /**
   * Hide install button
   */
  private hideInstallButton() {
    window.dispatchEvent(new CustomEvent('pwa-install-available', {
      detail: { canInstall: false }
    }));
  }

  /**
   * Notify about update availability
   */
  private notifyUpdateAvailable() {
    window.dispatchEvent(new CustomEvent('pwa-update-available', {
      detail: { updateAvailable: true }
    }));
  }

  /**
   * Notify about online status change
   */
  private notifyOnlineStatus(isOnline: boolean) {
    window.dispatchEvent(new CustomEvent('pwa-online-status', {
      detail: { isOnline }
    }));
  }

  /**
   * Sync offline data when back online
   */
  private async syncOfflineData() {
    if (this.registration && 'sync' in this.registration) {
      try {
        await (this.registration as any).sync.register('sync-offline-data');
        console.log('🔄 Background sync registered');
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }

  /**
   * Track installation for analytics
   */
  private trackInstallation() {
    // Send analytics event
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA Installation'
      });
    }
  }

  /**
   * Send push subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Public methods

  /**
   * Trigger install prompt
   */
  public async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('⚠️ No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        return true;
      } else {
        console.log('❌ User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  /**
   * Apply available update
   */
  public async applyUpdate(): Promise<void> {
    if (!this.updateAvailable || !this.registration) {
      console.warn('⚠️ No update available');
      return;
    }

    const waitingWorker = this.registration.waiting;
    if (waitingWorker) {
      waitingWorker.addEventListener('statechange', () => {
        if (waitingWorker.state === 'activated') {
          window.location.reload();
        }
      });

      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Schedule productivity notifications
   */
  public async scheduleProductivityNotifications(settings: {
    enabled: boolean;
    interval: number; // minutes
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  }): Promise<void> {
    if (!settings.enabled || Notification.permission !== 'granted') {
      return;
    }

    // This would typically be handled by the service worker
    // For now, we'll use a simple setTimeout approach
    const scheduleNext = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = settings.startTime.split(':').map(Number);
      const [endHour, endMin] = settings.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (currentTime >= startTime && currentTime <= endTime) {
        setTimeout(() => {
          new Notification('🍅 FocusMate AI', {
            body: 'Time for a productive focus session!',
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: 'productivity-reminder',
            requireInteraction: false,
            silent: false
          });
          scheduleNext();
        }, settings.interval * 60 * 1000);
      }
    };

    scheduleNext();
  }

  /**
   * Get app info and capabilities
   */
  public getAppInfo() {
    return {
      isInstalled: this.isInstalled,
      canInstall: !!this.deferredPrompt,
      isOnline: this.isOnline,
      updateAvailable: this.updateAvailable,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      notificationSupported: 'Notification' in window,
      pushSupported: 'PushManager' in window,
      backgroundSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }

  /**
   * Clear all caches (for debugging)
   */
  public async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('🗑️ All caches cleared');
    }
  }

  /**
   * Get storage usage info
   */
  public async getStorageInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          usageDetails: (estimate as any).usageDetails,
          percentageUsed: estimate.quota ? (estimate.usage! / estimate.quota * 100) : 0
        };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
        return null;
      }
    }
    return null;
  }
}

// Create singleton instance
export const pwaService = new PWAService();
export default PWAService;
