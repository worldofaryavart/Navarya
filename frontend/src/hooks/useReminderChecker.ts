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
      console.log('Checking reminders...', new Date().toISOString());
      
      const dueReminders = notificationService.checkDueReminders(tasks);
      console.log('Due reminders:', dueReminders);
      
      if (dueReminders?.length > 0) {
        setReminderCount(dueReminders.length);
        console.log(`Found ${dueReminders.length} due reminders`);

        // Mark notifications as sent
        for (const task of dueReminders) {
          await notificationService.updateNotificationSent(task.id);
          console.log(`Marked notification as sent for task ${task.id}`);
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
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

    // Set up interval only if mounted
    if (mounted) {
      // Check every 30 seconds
      intervalId = setInterval(runCheck, 30000);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkReminders]);
};
