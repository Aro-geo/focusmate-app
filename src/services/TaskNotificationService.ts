import { Todo } from '../hooks/useTodos';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface TaskNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  scheduledTime: Date;
  type: 'due' | 'scheduled';
  sent: boolean;
}

class TaskNotificationService {
  private notifications: TaskNotification[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.requestPermission();
    this.startNotificationChecker();
  }

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Schedule a notification for a task due date
   */
  scheduleTaskDueNotification(task: Todo): void {
    if (!task.due_date) return;

    const dueDate = new Date(task.due_date);
    const now = new Date();
    
    // Schedule notification 1 hour before due date
    const notificationTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
    
    if (notificationTime > now) {
      const notification: TaskNotification = {
        id: `due-${task.id}-${Date.now()}`,
        taskId: task.id,
        title: 'Task Due Soon',
        message: `"${task.title}" is due in 1 hour`,
        scheduledTime: notificationTime,
        type: 'due',
        sent: false
      };

      this.notifications.push(notification);
    }

    // Schedule notification at due date
    if (dueDate > now) {
      const dueDateNotification: TaskNotification = {
        id: `due-now-${task.id}-${Date.now()}`,
        taskId: task.id,
        title: 'Task Due Now',
        message: `"${task.title}" is due now!`,
        scheduledTime: dueDate,
        type: 'due',
        sent: false
      };

      this.notifications.push(dueDateNotification);
    }
  }

  /**
   * Schedule a notification for a scheduled task
   */
  scheduleTaskReminder(task: Todo, reminderTime: Date): void {
    const now = new Date();
    
    if (reminderTime > now) {
      const notification: TaskNotification = {
        id: `scheduled-${task.id}-${Date.now()}`,
        taskId: task.id,
        title: 'Scheduled Task Reminder',
        message: `Time to work on: "${task.title}"`,
        scheduledTime: reminderTime,
        type: 'scheduled',
        sent: false
      };

      this.notifications.push(notification);
    }
  }

  /**
   * Send a browser notification
   */
  private async sendNotification(notification: TaskNotification): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Task'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      });

      browserNotification.onclick = () => {
        window.focus();
        // Navigate to tasks page or specific task
        window.location.hash = '#/app/tasks';
        browserNotification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 10000);

      notification.sent = true;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Start the notification checker interval
   */
  private startNotificationChecker(): void {
    // Check every minute for due notifications
    this.checkInterval = setInterval(() => {
      this.checkAndSendNotifications();
    }, 60000); // 1 minute
  }

  /**
   * Check for notifications that need to be sent
   */
  private checkAndSendNotifications(): void {
    const now = new Date();
    
    this.notifications
      .filter(notification => !notification.sent && notification.scheduledTime <= now)
      .forEach(notification => {
        this.sendNotification(notification);
      });

    // Clean up old sent notifications (older than 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(
      notification => !notification.sent || notification.scheduledTime > oneDayAgo
    );
  }

  /**
   * Cancel notifications for a specific task
   */
  cancelTaskNotifications(taskId: string): void {
    this.notifications = this.notifications.filter(
      notification => notification.taskId !== taskId
    );
  }

  /**
   * Get all pending notifications
   */
  getPendingNotifications(): TaskNotification[] {
    return this.notifications.filter(notification => !notification.sent);
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.notifications = [];
  }

  /**
   * Stop the notification service
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Show an immediate notification for testing
   */
  async testNotification(): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      alert('Please enable notifications to receive task reminders');
      return;
    }

    const testNotification = new Notification('FocusMate AI', {
      body: 'Task notifications are working! You\'ll receive reminders for due and scheduled tasks.',
      icon: '/favicon.ico',
      tag: 'test-notification'
    });

    setTimeout(() => {
      testNotification.close();
    }, 5000);
  }
}

// Create a singleton instance
const taskNotificationService = new TaskNotificationService();

export default taskNotificationService;
export type { TaskNotification };