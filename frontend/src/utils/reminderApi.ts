import { Reminder } from "@/types/reminderTypes";

const API_BASE_URL = 'http://localhost:8000/api';

export const checkForReminder = async (content: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/check-reminder`, {
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
    const response = await fetch(`${API_BASE_URL}/reminders`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }
};

export const completeReminder = async (reminderId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}/complete`, {
      method: 'PUT',
    });
    return response.ok;
  } catch (error) {
    console.error('Error completing reminder:', error);
    return false;
  }
};
