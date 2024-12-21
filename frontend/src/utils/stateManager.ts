import { Task } from "@/types/taskTypes";

// Custom event names
export const EVENTS = {
  TASKS_UPDATED: 'TASKS_UPDATED',
  SHOW_TOAST: 'SHOW_TOAST',
} as const;

export type ToastData = {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
};

// Task management
export const getTasks = async (): Promise<Task[]> => {
  try {
    const response = await fetch('/api/tasks');
    const data = await response.json();
    localStorage.setItem('tasks', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    // Return cached tasks if available
    const cachedTasks = localStorage.getItem('tasks');
    return cachedTasks ? JSON.parse(cachedTasks) : [];
  }
};

// Event emitter for tasks
export const updateTasks = (tasks: Task[]) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  window.dispatchEvent(new CustomEvent(EVENTS.TASKS_UPDATED, { detail: tasks }));
};
