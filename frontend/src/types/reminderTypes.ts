export interface Reminder {
  id: number;
  task: string;
  reminder_time: string;
  created_at: string;
  is_completed: boolean;
}

export interface ReminderState {
  reminders: Reminder[];
  showReminders: boolean;
}
