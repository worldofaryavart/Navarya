import { useCallback } from 'react';
import { taskReminderService } from '@/services/taskReminderService';

export const useTaskReminders = () => {
  const addReminder = useCallback(async (taskId: string, reminderTime: Date, recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
  }) => {
    if (typeof window === 'undefined') return;

    try {
      return await taskReminderService.addReminder(taskId, reminderTime, recurring);
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }, []);

  const removeReminder = useCallback(async (taskId: string) => {
    if (typeof window === 'undefined') return;

    try {
      await taskReminderService.removeReminder(taskId);
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
