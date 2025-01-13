import { Reminder } from "@/types/reminderTypes";
import { getApiUrl } from '@/utils/config/api.config';
import { auth } from '@/utils/config/firebase.config';

const getAuthHeaders = async () => {
  if (!auth) {
    throw new Error('Authentication not initialized');
  }
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('User not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const checkForReminder = async (content: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(getApiUrl('/api/check-reminder'), {
      method: 'POST',
      headers,
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
    const headers = await getAuthHeaders();
    const response = await fetch(getApiUrl('/api/reminders'), {
      headers,
    });
    
    if (!response.ok) throw new Error('Failed to fetch reminders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw new Error('Failed to fetch reminders');
  }
};

export const completeReminder = async (reminderId: number): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(getApiUrl(`/api/reminders/${reminderId}/complete`), {
      method: 'PUT',
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to complete reminder');
    }
  } catch (error) {
    console.error('Error completing reminder:', error);
    throw error;
  }
};
