import { useState, useEffect, useCallback } from 'react';
import { Reminder } from '@/types/reminderTypes';
import { checkForReminder, getReminders, completeReminder } from '@/utils/reminder/reminderService';
import { useAuth } from '@/hooks/useAuth';

export const useReminderSystem = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkForDueReminders = useCallback((reminders: Reminder[]) => {
    const now = new Date();
    reminders.forEach(reminder => {
      const reminderTime = new Date(reminder.reminder_time);
      const timeDiff = reminderTime.getTime() - now.getTime();
      
      // Log reminders that are due within the next minute
      if (timeDiff > 0 && timeDiff <= 60000) {
        console.log(`Reminder due: ${reminder.task}`);
      }
    });
  }, []);

  const fetchReminders = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      const fetchedReminders = await getReminders();
      setReminders(fetchedReminders);
      checkForDueReminders(fetchedReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setError('Failed to fetch reminders');
    }
  }, [checkForDueReminders, user]);

  useEffect(() => {
    if (user) {
      fetchReminders();
      // Poll for new reminders every 30 seconds
      const interval = setInterval(fetchReminders, 30000);
      return () => clearInterval(interval);
    } else {
      setReminders([]);
      setError(null);
    }
  }, [fetchReminders, user]);

  const checkTaskForReminder = async (taskContent: string) => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);
      const result = await checkForReminder(taskContent);
      if (result.has_reminder) {
        console.log(`Reminder set for: ${taskContent}`);
        await fetchReminders();
      }
      return result.has_reminder;
    } catch (error) {
      console.error('Error checking for reminder:', error);
      setError('Failed to check for reminder');
      return false;
    }
  };

  const handleCompleteReminder = async (reminderId: number) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      await completeReminder(reminderId);
      // Update local state to remove the completed reminder
      setReminders(prevReminders => prevReminders.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Error completing reminder:', error);
      setError('Failed to complete reminder');
    }
  };

  const toggleReminders = () => {
    setShowReminders(prev => !prev);
  };

  return {
    reminders,
    showReminders,
    toggleReminders,
    checkTaskForReminder,
    handleCompleteReminder,
    error,
  };
};
