import { useEffect, useCallback, useRef } from 'react';
import { Task } from '@/types/taskTypes';
import { notificationService } from '@/services/notificationService';
import { useUIStore } from '@/store/uiStateStore';

export const useReminderChecker = (tasks: Task[]) => {
  const { setReminderCount } = useUIStore();
  const checkInProgress = useRef(false);

  const checkReminders = useCallback(async () => {
    if (typeof window === 'undefined' || checkInProgress.current) return;
    
    try {
      checkInProgress.current = true;
      const now = new Date();
      console.log('Checking reminders...', now.toISOString());
      
      const tasksWithReminders = tasks.filter(task => {
        if (!task.reminder?.time) {
          console.log(`Task ${task.id} has no reminder`);
          return false;
        }
        
        const reminderTime = task.reminder.time instanceof Date 
          ? task.reminder.time 
          : new Date((task.reminder.time as any).seconds * 1000);
          
        console.log(`Task ${task.id} reminder time:`, reminderTime.toISOString());
        console.log(`Task ${task.id} full reminder data:`, task.reminder);
        return true;
      });

      console.log('Tasks with reminders:', tasksWithReminders);

      const dueReminders = tasksWithReminders.filter(task => {
        const reminderTime = task.reminder!.time instanceof Date 
          ? task.reminder!.time 
          : new Date((task.reminder!.time as any).seconds * 1000);
        
        const timeDiff = reminderTime.getTime() - now.getTime();
        console.log(`Task ${task.id} time difference:`, timeDiff, 'ms');
        
        const isWithinLastMinute = Math.abs(timeDiff) <= 60000; // 1 minute
        const shouldNotify = isWithinLastMinute && !task.reminder!.notificationSent;

        console.log(`Task ${task.id} notification status:`, {
          isWithinLastMinute,
          notificationSent: task.reminder!.notificationSent,
          shouldNotify
        });

        if (shouldNotify) {
          notificationService.showNotification(task);
          return true;
        }
        return false;
      });

      if (dueReminders.length > 0) {
        setReminderCount(dueReminders.length);
        console.log(`Found ${dueReminders.length} due reminders:`, dueReminders);

        // Mark notifications as sent
        for (const task of dueReminders) {
          await notificationService.updateNotificationSent(task.id);
          console.log(`Marked notification as sent for task ${task.id}`);
        }
      }

      return tasksWithReminders;
    } catch (error) {
      console.error('Error checking reminders:', error);
      return [];
    } finally {
      checkInProgress.current = false;
    }
  }, [tasks, setReminderCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Request notification permission immediately
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const runCheck = async () => {
      if (mounted) {
        await checkReminders();
      }
    };

    // Initial check
    runCheck();

    // Set up interval for periodic checks
    intervalId = setInterval(runCheck, 15000); // Check every 15 seconds

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkReminders]);

  return checkReminders;
};
