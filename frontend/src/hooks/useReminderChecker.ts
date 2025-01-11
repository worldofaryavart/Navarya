import { useEffect, useCallback } from 'react';
import { Task } from '@/types/taskTypes';
import { notificationService } from '@/services/notificationService';
import { useUIStore } from '@/store/uiStateStore';

export const useReminderChecker = (tasks: Task[]) => {
  const { setReminderCount } = useUIStore();

  const checkReminders = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const dueReminders = notificationService.checkDueReminders(tasks);
    if (dueReminders?.length !== undefined) {
      setReminderCount(dueReminders.length);

      // Mark notifications as sent
      for (const task of dueReminders) {
        await notificationService.updateNotificationSent(task.id);
      }
    }
  }, [tasks, setReminderCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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
      intervalId = setInterval(runCheck, 60000);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkReminders]);
};
