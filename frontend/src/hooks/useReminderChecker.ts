import { useEffect, useCallback, useRef } from 'react';
import { Task } from '@/types/taskTypes';
import { notificationService } from '@/services/notificationService';
import { useUIStore } from '@/store/uiStateStore';

export const useReminderChecker = (tasks: Task[]) => {
  const { setReminderCount } = useUIStore();
  const checkInProgress = useRef(false);

  const checkReminders = useCallback(async () => {
    if (checkInProgress.current) return;
    
    try {
      checkInProgress.current = true;
      const now = new Date();
      
      const tasksWithReminders = tasks.filter(task => {
        if (!task.reminder?.time) return false;
        
        const reminderTime = new Date(task.reminder.time.seconds * 1000);
        return true;
      });

      const dueReminders = tasksWithReminders.filter(task => {
        const reminderTime = new Date(task.reminder!.time.seconds * 1000);
        const timeDiff = reminderTime.getTime() - now.getTime();
        
        const isWithinLastMinute = Math.abs(timeDiff) <= 60000; // 1 minute
        const shouldNotify = isWithinLastMinute && !task.reminder!.notificationSent;
        
        if (shouldNotify) {
          notificationService.showNotification(task);
          return true;
        }
        return false;
      });

      if (dueReminders.length > 0) {
        setReminderCount(dueReminders.length);

        // Mark notifications as sent
        for (const task of dueReminders) {
          await notificationService.updateNotificationSent(task.id);
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    } finally {
      checkInProgress.current = false;
    }
  }, [tasks, notificationService]);

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
