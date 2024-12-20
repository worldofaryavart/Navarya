export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate?: string | Date | { seconds: number; nanoseconds: number } | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
}

// Type for adding a new task without required fields
export type NewTaskInput = Omit<Task, 'id' | 'status' | 'createdAt'> & {
  status?: TaskStatus;
}