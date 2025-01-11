import { useEffect, useCallback } from 'react';
import { Task } from '@/types/taskTypes';
import { notificationService } from '@/services/notificationService';
import { useUIStore } from '@/store/uiStateStore';

export const useTaskReminders = (tasks: Task[]) => {
  const { setReminderCount } = useUIStore();

  const checkReminders = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const dueReminders = notificationService.checkDueReminders(tasks);
    setReminderCount(dueReminders.length);

    // Mark notifications as sent
    for (const task of dueReminders) {
      await notificationService.updateNotificationSent(task.id);
    }
  }, [tasks, setReminderCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check reminders immediately
    checkReminders();

    // Check reminders every minute
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  const addReminder = useCallback(async (taskId: string, reminderTime: Date, recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
  }) => {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/reminder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderTime, recurring }),
      });

      if (!response.ok) throw new Error('Failed to add reminder');
      return await response.json();
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }, []);

  const removeReminder = useCallback(async (taskId: string) => {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/reminder`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove reminder');
    } catch (error) {
      console.error('Error removing reminder:', error);
      throw error;
    }
  }, []);

  return {
    addReminder,
    removeReminder,
  };
};
