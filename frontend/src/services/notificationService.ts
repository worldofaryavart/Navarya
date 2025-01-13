import { Task } from '@/types/taskTypes';
import { getApiUrl } from '@/utils/config/api.config';
import { getAuth } from 'firebase/auth';
import { app } from '@/utils/config/firebase.config';

interface NotificationOptionsWithVibrate extends NotificationOptions {
  vibrate?: number[];
}

class NotificationService {
  private notificationSupported: boolean = false;
  private auth = getAuth(app);

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
        } else {
          console.log('Notification permission:', permission);
        }
      } else {
        console.log('Notifications not supported in this browser');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  private async getAuthHeaders() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    const token = await currentUser.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private showNotification(task: Task) {
    if (typeof window === 'undefined') return;
    
    console.log('Showing notification for task:', task.title);
    
    if (this.notificationSupported && Notification.permission === 'granted') {
      try {
        const notification = new Notification(task.title, {
          body: `Task "${task.title}" is due now!`,
          icon: '/favicon.ico',
          tag: task.id,
          requireInteraction: true, // Keep notification until user interacts
          silent: false, // Use system sound
          vibrate: [200, 100, 200], // Vibrate pattern for mobile devices
        } as NotificationOptionsWithVibrate);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        console.log('Notification shown successfully');
      } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback to alert
        alert(`Reminder: Task "${task.title}" is due now!`);
      }
    } else {
      console.log('Using alert fallback due to notification not supported/permitted');
      alert(`Reminder: Task "${task.title}" is due now!`);
    }
  }

  public checkDueReminders(tasks: Task[]): Task[] {
    if (typeof window === 'undefined') return [];

    console.log('Checking due reminders for tasks:', tasks.length);
    
    const now = new Date();
    const dueReminders = tasks.filter(task => {
      if (!task.reminder || task.status === 'Completed') {
        return false;
      }

      const reminderTime = task.reminder.time instanceof Date
        ? task.reminder.time
        : new Date(task.reminder.time.seconds * 1000);

      console.log(`Task "${task.title}" reminder time:`, reminderTime);
      
      // Check if the reminder is due and notification hasn't been sent
      const isDue = !task.reminder.notificationSent && reminderTime <= now;
      
      if (isDue) {
        console.log(`Task "${task.title}" is due!`);
        // Show notification for due reminder
        this.showNotification(task);
      }

      return isDue;
    });

    console.log('Due reminders found:', dueReminders.length);
    return dueReminders;
  }

  public async updateNotificationSent(taskId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const headers = await this.getAuthHeaders();
      console.log('Updating notification status for task:', taskId);
      
      const response = await fetch(getApiUrl(`/api/tasks/${taskId}/reminder/notification`), {
        method: 'PUT',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to update notification status');
      }
      
      console.log('Successfully updated notification status');
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
