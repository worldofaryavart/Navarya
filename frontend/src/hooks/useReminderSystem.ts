import { useState, useEffect, useCallback } from 'react';
import { Reminder } from '@/types/reminderTypes';
import { checkForReminder, getReminders, completeReminder } from '@/utils/reminderApi';

export const useReminderSystem = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);

  const fetchReminders = useCallback(async () => {
    const fetchedReminders = await getReminders();
    setReminders(fetchedReminders);
  }, []);

  useEffect(() => {
    fetchReminders();
    // Poll for new reminders every minute
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const checkTaskForReminder = async (taskContent: string) => {
    const result = await checkForReminder(taskContent);
    if (result.has_reminder) {
      await fetchReminders();
    }
    return result.has_reminder;
  };

  const handleCompleteReminder = async (reminderId: number) => {
    const success = await completeReminder(reminderId);
    if (success) {
      setReminders(prev => prev.filter(r => r.id !== reminderId));
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
    handleCompleteReminder
  };
};
