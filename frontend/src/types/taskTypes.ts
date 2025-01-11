export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export interface TaskReminder {
  time: Date | { seconds: number; nanoseconds: number };
  recurring?: {
    frequency: ReminderFrequency;
    interval: number; // e.g., every 2 days, every 3 weeks
    endDate?: Date | { seconds: number; nanoseconds: number };
  };
  notificationSent: boolean;
  lastNotification?: Date | { seconds: number; nanoseconds: number };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate?: Date | { seconds: number; nanoseconds: number } | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date | { seconds: number; nanoseconds: number };
  reminder?: TaskReminder;
  source?: {
    type: 'email';
    emailId: string;
  };
}

export type NewTaskInput = Omit<Task, 'id' | 'status' | 'createdAt'> & {
  status?: TaskStatus;
  reminder?: Omit<TaskReminder, 'notificationSent' | 'lastNotification'>;
};