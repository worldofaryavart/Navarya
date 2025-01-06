// reminder handler 

import { getApiUrl } from '@/utils/config/api.config';

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export class ReminderCommandHandler {
  public static async listReminders(filter?: {
    status?: 'missed' | 'today' | 'upcoming' | 'completed';
    timeframe?: 'today' | 'tomorrow' | 'week';
  }): Promise<CommandResult> {
    try {
      const response = await fetch(getApiUrl('/api/reminders'));
      const reminders = await response.json();
      
      if (!Array.isArray(reminders)) {
        throw new Error('Invalid response format');
      }

      if (reminders.length === 0) {
        return {
          success: true,
          message: "You don't have any reminders.",
          data: reminders
        };
      }

      let filteredReminders = [...reminders];
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      const endOfTomorrow = new Date(endOfDay);
      endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
      const endOfWeek = new Date(startOfDay);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      if (filter) {
        if (filter.status) {
          switch (filter.status) {
            case 'missed':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime < now && !reminder.is_completed;
              });
              break;
            case 'today':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= startOfDay && reminderTime < endOfDay && !reminder.is_completed;
              });
              break;
            case 'upcoming':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= now && !reminder.is_completed;
              });
              break;
            case 'completed':
              filteredReminders = filteredReminders.filter(reminder => reminder.is_completed);
              break;
          }
        }

        if (filter.timeframe) {
          switch (filter.timeframe) {
            case 'today':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= startOfDay && reminderTime < endOfDay;
              });
              break;
            case 'tomorrow':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= endOfDay && reminderTime < endOfTomorrow;
              });
              break;
            case 'week':
              filteredReminders = filteredReminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                return reminderTime >= startOfDay && reminderTime < endOfWeek;
              });
              break;
          }
        }
      }

      if (filteredReminders.length === 0) {
        let message = "No reminders found";
        if (filter?.status) message += ` that are ${filter.status}`;
        if (filter?.timeframe) message += ` for ${filter.timeframe}`;
        return {
          success: true,
          message: message + ".",
          data: []
        };
      }

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = startOfDay;
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date < now) {
          return `${date.toLocaleString()} (Missed)`;
        } else if (date.toDateString() === today.toDateString()) {
          return `Today at ${date.toLocaleTimeString()}`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
          return `Tomorrow at ${date.toLocaleTimeString()}`;
        } else {
          return date.toLocaleString();
        }
      };

      const reminderList = filteredReminders.map(reminder => {
        const status = reminder.is_completed ? "Completed" : 
                      new Date(reminder.reminder_time) < now ? "Missed" : 
                      "Pending";
        return `- ${reminder.task} (${formatDate(reminder.reminder_time)}) - Status: ${status}`;
      }).join('\n');

      const countMessage = filteredReminders.length === 1 ? 
        "Found 1 reminder" : 
        `Found ${filteredReminders.length} reminders`;

      let filterDescription = "";
      if (filter?.status) filterDescription += ` that are ${filter.status}`;
      if (filter?.timeframe) filterDescription += ` for ${filter.timeframe}`;

      return {
        success: true,
        message: `${countMessage}${filterDescription}:\n${reminderList}`,
        data: filteredReminders
      };
    } catch (error) {
      console.error('List reminders error:', error);
      return {
        success: false,
        message: 'Failed to fetch reminders'
      };
    }
  }
}