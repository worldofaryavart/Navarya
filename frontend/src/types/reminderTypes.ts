// export interface Reminder {
//   id: number;
//   task: string;
//   reminder_time: string;
//   created_at: string;
//   is_completed: boolean;
// }
export interface Reminder {
  id: number;
  task: string;  // This contains the task content/title
  reminder_time: string;
  created_at: string;
  is_completed: boolean;
  is_due?: boolean;  // Added from backend
}
export interface ReminderState {
  reminders: Reminder[];
  showReminders: boolean;
}
