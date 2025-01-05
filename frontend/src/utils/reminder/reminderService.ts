import { Reminder } from "@/types/reminderTypes";
import { getApiUrl } from '@/utils/config/api.config';

// export interface Reminder {
//   id: number;
//   taskId?: string;
//   reminderTime: string;
//   message: string;
//   completed: boolean;
// }

export const checkForReminder = async (content: string) => {
  try {
    const response = await fetch(getApiUrl('/api/check-reminder'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error checking for reminder:', error);
    return { has_reminder: false };
  }
};

export const getReminders = async (): Promise<Reminder[]> => {
  try {
    const response = await fetch(getApiUrl('/api/reminders'));
    if (!response.ok) throw new Error('Failed to fetch reminders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
};

export const completeReminder = async (reminderId: number): Promise<void> => {
  try {
    const response = await fetch(getApiUrl(`/api/reminders/${reminderId}/complete`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to complete reminder');
    }
  } catch (error) {
    console.error('Error completing reminder:', error);
    throw error;
  }
};
