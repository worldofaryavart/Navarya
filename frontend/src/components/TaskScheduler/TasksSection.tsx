import React from 'react';
import { Task, FirestoreTimestamp } from '@/types/taskTypes';
import { useUIStore } from '@/store/uiStateStore';
import { formatDateToDisplay, parseDateFromDisplay } from '@/utils/dateUtils';

interface TasksSectionProps {
  tasks: Task[];
}

const TasksSection: React.FC<TasksSectionProps> = ({ tasks }) => {
  const { selectedDate } = useUIStore();

  // Helper function to convert various date formats to Date object
  const convertToDate = (value: FirestoreTimestamp | Date | string | null | undefined): Date => {
    if (!value) return new Date();
    
    // If it's already a Date object
    if (value instanceof Date) {
      return value;
    }
    
    // If it's a Firestore timestamp object
    if (typeof value === 'object' && 'seconds' in value) {
      return new Date(value.seconds * 1000);
    }
    
    // If it's a formatted display string
    if (typeof value === 'string' && value.includes('UTC')) {
      return parseDateFromDisplay(value);
    }
    
    // If it's an ISO string or any other date string
    return new Date(value);
  };

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
    if (!date1 || !date2) return false;
    
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Helper function to check if a date is today
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    return isSameDay(date, new Date());
  };

  // Get today's tasks and sort by priority
  const getTodaysTasks = () => {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return tasks
      .filter((task) => {
        const taskDate = convertToDate(task.dueDate);
        return isToday(taskDate);
      })
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  // Get tasks for a specific date and sort by priority
  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return tasks
      .filter((task) => {
        const taskDate = convertToDate(task.dueDate);
        return taskDate && isSameDay(taskDate, date);
      })
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  // Get the tasks to display based on selected date
  const getDisplayTasks = () => {
    const compareDate = selectedDate ? convertToDate(selectedDate) : new Date();
    return isToday(compareDate) ? getTodaysTasks() : getTasksForDate(compareDate);
  };

  // Get the display date
  const getDisplayDate = (): Date => {
    return selectedDate ? convertToDate(selectedDate) : new Date();
  };

  const displayTasks = getDisplayTasks();
  const displayDate = getDisplayDate();

  return (
    <div className="p-3">
      <div className="flex items-center mb-3">
        <h3 className="text-blue-400 font-medium mr-2">
          {isToday(displayDate) ? "Today's Tasks" : "Tasks"}
        </h3>
        <span className="text-xs text-gray-400">
          ({formatDateToDisplay(displayDate.toISOString())})
        </span>
      </div>

      {displayTasks.length > 0 ? (
        <div className="space-y-1.5">
          {displayTasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-700/50 hover:bg-gray-700 rounded px-3 py-2 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    task.priority === "High" 
                      ? "bg-red-500/20 text-red-300"
                      : task.priority === "Medium"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-green-500/20 text-green-300"
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-sm text-gray-200">{task.title}</span>
                </div>
                <span className={`text-xs px-2 rounded-full ${
                  task.status === "Completed"
                    ? "bg-green-500/20 text-green-300"
                    : task.status === "In Progress"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}>
                  {task.status}
                </span>
              </div>
              {task.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                  {task.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400 text-center py-3">
          No tasks for {isToday(displayDate) ? "today" : "selected date"}
        </div>
      )}
    </div>
  );
};

export default TasksSection;
