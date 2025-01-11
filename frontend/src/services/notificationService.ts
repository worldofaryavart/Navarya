import { Task } from '@/types/taskTypes';

class NotificationService {
  private socket: WebSocket | null = null;
  private userId: string | null = null;
  private notificationSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeNotifications();
    }
  }

  private async initializeNotifications() {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          this.notificationSupported = true;
          console.log('Notification permission granted');
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  public connect(userId: string) {
    if (typeof window === 'undefined') return;

    this.userId = userId;
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
      };
      
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'reminder') {
          this.showNotification(data.task);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connect(userId), 5000);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private showNotification(task: Task) {
    if (typeof window === 'undefined') return;
    
    if (this.notificationSupported && Notification.permission === 'granted') {
      try {
        const notification = new Notification('Task Reminder', {
          body: `Task "${task.title}" is due`,
          icon: '/favicon.ico',
          tag: task.id,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  }

  public checkDueReminders(tasks: Task[]): Task[] {
    if (typeof window === 'undefined') return [];

    const now = new Date();
    return tasks.filter(task => {
      if (!task.reminder || task.status === 'Completed') return false;

      const reminderTime = task.reminder.time instanceof Date
        ? task.reminder.time
        : new Date(task.reminder.time.seconds * 1000);

      return !task.reminder.notificationSent && reminderTime <= now;
    });
  }

  public async updateNotificationSent(taskId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/reminder/notification`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to update notification status');
      }
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
