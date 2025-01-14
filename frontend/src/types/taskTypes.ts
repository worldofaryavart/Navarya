export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export interface TaskReminder {
  time: FirestoreTimestamp;
  recurring?: {
    frequency: ReminderFrequency;
    interval: number; 
    endDate?: FirestoreTimestamp;
  };
  notificationSent: boolean;
  lastNotification?: FirestoreTimestamp;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: FirestoreTimestamp | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: FirestoreTimestamp;
  reminder?: TaskReminder;
  source?: {
    type: 'email';
    emailId: string;
  };
  userId: string;
}

export type NewTaskInput = Omit<Task, 'id' | 'status' | 'createdAt'> & {
  status?: TaskStatus;
  reminder?: Omit<TaskReminder, 'notificationSent' | 'lastNotification'>;
};