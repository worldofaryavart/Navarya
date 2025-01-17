import { useEffect, useCallback, useRef } from 'react';
import { Task } from '@/types/taskTypes';
import { notificationService } from '@/services/notification_services/notificationService';
import { useUIStore } from '@/store/uiStateStore';
import { Timestamp } from 'firebase/firestore';

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
        // Only include tasks that haven't been notified yet
        return !task.reminder.notificationSent;
      });

      const dueReminders = tasksWithReminders.filter(task => {
        const reminderTime = new Date(task.reminder!.time.seconds * 1000);
        const timeDiff = reminderTime.getTime() - now.getTime();
        
        // Consider a task due if it's within 5 seconds of its reminder time
        const isDueTime = Math.abs(timeDiff) <= 5000;
        
        if (isDueTime) {
          console.log('Task due for notification:', task.id, task.title);
          notificationService.showNotification(task);
          return true;
        }
        return false;
      });

      if (dueReminders.length > 0) {
        setReminderCount(dueReminders.length);
        
        // Mark notifications as sent immediately
        for (const task of dueReminders) {
          try {
            // Update backend first
            await notificationService.updateNotificationSent(task.id);
            
            // Force update the task's reminder state
            task.reminder = {
              ...task.reminder!,
              notificationSent: true,
              lastNotification: Timestamp.fromDate(now)
            };
            
            // Force a re-render of the task component
            const updatedTask = { ...task };
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
              tasks[taskIndex] = updatedTask;
            }
          } catch (error) {
            console.error('Error updating notification status for task:', task.id, error);
          }
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

    // Check more frequently (every 2 seconds) for more responsive notifications
    intervalId = setInterval(runCheck, 2000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkReminders]);

  return checkReminders;
};
