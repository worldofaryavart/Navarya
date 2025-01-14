import { getApiUrl } from '@/utils/config/api.config';
import { auth } from '@/utils/config/firebase.config';

interface RecurringReminder {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: Date;
}

const getAuthHeaders = async () => {
  if (!auth) {
    throw new Error('Authentication not initialized');
  }
  const token = await auth.currentUser?.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
  };
};

export const taskReminderService = {
  addReminder: async (taskId: string, reminderTime: Date, recurring?: RecurringReminder) => {
    try {
      const headers = await getAuthHeaders();
      const requestBody = {
        reminderTime: reminderTime.toISOString(),
        recurring: recurring ? {
          ...recurring,
          endDate: recurring.endDate?.toISOString()
        } : undefined
      };

      console.log("Sending reminder request:", requestBody);

      const response = await fetch(getApiUrl(`/api/tasks/${taskId}/reminder`), {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        throw new Error(`Failed to add reminder: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Reminder response:", data);
      return data;
    } catch (error) {
      console.error('Error in addReminder:', error);
      throw error;
    }
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
