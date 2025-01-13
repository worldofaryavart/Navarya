import { getApiUrl } from '@/utils/config/api.config';
import { auth } from '@/utils/config/firebase.config';

interface RecurringReminder {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
}

const getAuthHeaders = async () => {
  if (!auth) {
    throw new Error('Authentication not initialized');
  }
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const taskReminderService = {
  addReminder: async (taskId: string, reminderTime: Date, recurring?: RecurringReminder) => {
    const headers = await getAuthHeaders();
    const response = await fetch(getApiUrl(`/api/tasks/${taskId}/reminder`), {
      method: 'PUT',
      headers,
      body: JSON.stringify({ reminderTime, recurring }),
    });

    if (!response.ok) throw new Error('Failed to add reminder');
    return await response.json();
  },

  removeReminder: async (taskId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(getApiUrl(`/api/tasks/${taskId}/reminder`), {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) throw new Error('Failed to remove reminder');
  },

  getTaskReminders: async (taskId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(getApiUrl(`/api/tasks/${taskId}/reminders`), {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch task reminders');
    return await response.json();
  }
};
