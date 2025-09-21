import { firebaseService } from './FirebaseService';

class OfflineFirebaseService {
  private cache = new Map();
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncCachedData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async getTasks() {
    try {
      const tasks = await firebaseService.getTasks();
      this.cache.set('tasks', tasks);
      return tasks;
    } catch (error: any) {
      // If CORS or network error, return cached data
      if (this.isCORSError(error)) {
        console.warn('CORS error detected, using cached tasks');
        return this.cache.get('tasks') || [];
      }
      throw error;
    }
  }

  async getPomodoroSessions(date?: string) {
    try {
      const sessions = await firebaseService.getPomodoroSessions(date);
      this.cache.set(`sessions_${date || 'all'}`, sessions);
      return sessions;
    } catch (error: any) {
      if (this.isCORSError(error)) {
        console.warn('CORS error detected, using cached sessions');
        return this.cache.get(`sessions_${date || 'all'}`) || [];
      }
      throw error;
    }
  }

  private isCORSError(error: any): boolean {
    return (
      error.code === 'unavailable' ||
      error.message?.includes('CORS') ||
      error.message?.includes('fetch') ||
      error.message?.includes('Access-Control-Allow-Origin') ||
      !this.isOnline
    );
  }

  private async syncCachedData() {
    // Sync cached data when back online
    if (this.isOnline) {
      try {
        await this.getTasks();
        await this.getPomodoroSessions();
      } catch (error) {
        console.warn('Failed to sync data when back online:', error);
      }
    }
  }

  // Delegate other methods to the original service
  async addTask(title: string, priority: 'low' | 'medium' | 'high' = 'medium', dueDate?: string) {
    return firebaseService.addTask(title, priority, dueDate);
  }

  async toggleTask(taskId: string) {
    return firebaseService.toggleTask(taskId);
  }

  async deleteTask(taskId: string) {
    return firebaseService.deleteTask(taskId);
  }

  async savePomodoroSession(sessionData: any) {
    return firebaseService.savePomodoroSession(sessionData);
  }
}

export const offlineFirebaseService = new OfflineFirebaseService();