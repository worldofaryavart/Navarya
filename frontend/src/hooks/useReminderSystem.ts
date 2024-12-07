import { useState, useEffect, useCallback } from 'react';
import { Reminder } from '@/types/reminderTypes';
import { checkForReminder, getReminders, completeReminder } from '@/utils/reminderApi';
import { useToast } from '@/context/ToastContext';

export const useReminderSystem = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);
  const { showToast } = useToast();

  const checkForDueReminders = useCallback((reminders: Reminder[]) => {
    const now = new Date();
    reminders.forEach(reminder => {
      const reminderTime = new Date(reminder.reminder_time);
      const timeDiff = reminderTime.getTime() - now.getTime();
      
      // Show toast for reminders that are due within the next minute
      if (timeDiff > 0 && timeDiff <= 60000) {
        showToast({
          type: 'reminder',
          title: 'Reminder',
          message: reminder.task,
          duration: 10000
        });
      }
    });
  }, [showToast]);

  const fetchReminders = useCallback(async () => {
    const fetchedReminders = await getReminders();
    setReminders(fetchedReminders);
    checkForDueReminders(fetchedReminders);
  }, [checkForDueReminders]);

  useEffect(() => {
    fetchReminders();
    // Poll for new reminders every 30 seconds
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const checkTaskForReminder = async (taskContent: string) => {
    const result = await checkForReminder(taskContent);
    if (result.has_reminder) {
      showToast({
        type: 'success',
        title: 'Reminder Set',
        message: `Reminder set for: ${taskContent}`,
        duration: 5000
      });
      await fetchReminders();
    }
    return result.has_reminder;
  };

  const handleCompleteReminder = async (reminderId: number) => {
    const success = await completeReminder(reminderId);
    if (success) {
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      showToast({
        type: 'success',
        message: 'Reminder marked as completed',
        duration: 3000
      });
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
