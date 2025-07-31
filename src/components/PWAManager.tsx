import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  X,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { pwaService } from '../services/PWAService';
import { useTheme } from '../context/ThemeContext';

const PWAManager: React.FC = () => {
  const { darkMode } = useTheme();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [appInfo, setAppInfo] = useState(pwaService.getAppInfo());
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: false,
    interval: 25, // minutes
    startTime: '09:00',
    endTime: '17:00'
  });

  useEffect(() => {
    // Listen for PWA events
    const handleInstallAvailable = (event: any) => {
      setShowInstallPrompt(event.detail.canInstall);
    };

    const handleUpdateAvailable = (event: any) => {
      setShowUpdatePrompt(event.detail.updateAvailable);
    };

    const handleOnlineStatus = (event: any) => {
      setIsOnline(event.detail.isOnline);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('pwa-online-status', handleOnlineStatus);

    // Get storage info
    updateStorageInfo();

    // Load notification settings
    loadNotificationSettings();

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('pwa-online-status', handleOnlineStatus);
    };
  }, []);

  const updateStorageInfo = async () => {
    const info = await pwaService.getStorageInfo();
    setStorageInfo(info);
  };

  const loadNotificationSettings = () => {
    const saved = localStorage.getItem('pwa-notification-settings');
    if (saved) {
      setNotificationSettings(JSON.parse(saved));
    }
  };

  const saveNotificationSettings = (settings: typeof notificationSettings) => {
    localStorage.setItem('pwa-notification-settings', JSON.stringify(settings));
    setNotificationSettings(settings);
    pwaService.scheduleProductivityNotifications(settings);
  };

  const handleInstall = async () => {
    const success = await pwaService.install();
    if (success) {
      setShowInstallPrompt(false);
      setAppInfo(pwaService.getAppInfo());
    }
  };

  const handleUpdate = async () => {
    await pwaService.applyUpdate();
    setShowUpdatePrompt(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Online/Offline Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg ${
          isOnline
            ? darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
            : darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
        }`}
      >
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </motion.div>

      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && !appInfo.isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <div className={`max-w-md w-full rounded-xl p-6 ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            } shadow-2xl`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Install FocusMate AI</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Get the full app experience
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className={`p-1 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                  title="Close install prompt"
                  aria-label="Close install prompt"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Works offline</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Fast, app-like experience</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Push notifications for focus reminders</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">No app store required</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowInstallPrompt(false)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    darkMode
                      ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Maybe Later
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstall}
                  className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Install</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Prompt */}
      <AnimatePresence>
        {showUpdatePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className={`max-w-sm rounded-xl p-4 shadow-lg ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-medium">Update Available</h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    A new version is ready to install
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowUpdatePrompt(false)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  Later
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  Update Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Settings Panel (for debugging/info) */}
      {(typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed bottom-4 left-4 z-40"
        >
          <details className={`max-w-sm rounded-xl p-4 shadow-lg ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <summary className="cursor-pointer flex items-center space-x-2 mb-3">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">PWA Info</span>
            </summary>
            
            <div className="space-y-3 text-xs">
              <div>
                <h5 className="font-medium mb-1">App Status</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Installed:</span>
                    <span className={appInfo.isInstalled ? 'text-green-500' : 'text-red-500'}>
                      {appInfo.isInstalled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Can Install:</span>
                    <span className={appInfo.canInstall ? 'text-green-500' : 'text-red-500'}>
                      {appInfo.canInstall ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Online:</span>
                    <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
                      {isOnline ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-1">Capabilities</h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Service Worker:</span>
                    <span className={appInfo.serviceWorkerSupported ? 'text-green-500' : 'text-red-500'}>
                      {appInfo.serviceWorkerSupported ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Notifications:</span>
                    <span className={appInfo.notificationSupported ? 'text-green-500' : 'text-red-500'}>
                      {appInfo.notificationSupported ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Push:</span>
                    <span className={appInfo.pushSupported ? 'text-green-500' : 'text-red-500'}>
                      {appInfo.pushSupported ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Background Sync:</span>
                    <span className={appInfo.backgroundSyncSupported ? 'text-green-500' : 'text-red-500'}>
                      {appInfo.backgroundSyncSupported ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>

              {storageInfo && (
                <div>
                  <h5 className="font-medium mb-1">Storage</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span>{formatBytes(storageInfo.usage || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quota:</span>
                      <span>{formatBytes(storageInfo.quota || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Percentage:</span>
                      <span>{Math.round(storageInfo.percentageUsed || 0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h5 className="font-medium mb-2">Notifications</h5>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={notificationSettings.enabled}
                      onChange={(e) => saveNotificationSettings({
                        ...notificationSettings,
                        enabled: e.target.checked
                      })}
                      className="w-3 h-3"
                    />
                    <span>Enable reminders</span>
                  </label>
                  {notificationSettings.enabled && (
                    <>
                      <div className="flex items-center space-x-2">
                        <span>Every:</span>
                        <input
                          type="number"
                          value={notificationSettings.interval}
                          onChange={(e) => saveNotificationSettings({
                            ...notificationSettings,
                            interval: parseInt(e.target.value)
                          })}
                          className="w-12 px-1 py-0.5 text-xs border rounded"
                          min="5"
                          max="120"
                        />
                        <span>min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={notificationSettings.startTime}
                          onChange={(e) => saveNotificationSettings({
                            ...notificationSettings,
                            startTime: e.target.value
                          })}
                          className="text-xs border rounded px-1 py-0.5"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={notificationSettings.endTime}
                          onChange={(e) => saveNotificationSettings({
                            ...notificationSettings,
                            endTime: e.target.value
                          })}
                          className="text-xs border rounded px-1 py-0.5"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  pwaService.clearCaches();
                  window.location.reload();
                }}
                className="w-full px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              >
                Clear Cache & Reload
              </button>
            </div>
          </details>
        </motion.div>
      )}
    </>
  );
};

export default PWAManager;
