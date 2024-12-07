export interface Reminder {
    id: string;
    taskId: string;
    reminderTime: Date;
    title: string;
    description?: string;
  }