import React from 'react';
import { Task } from '@/types/taskTypes';
import { useUIStore } from '@/store/uiStateStore';

interface TasksSectionProps {
  tasks: Task[];
}

const TasksSection: React.FC<TasksSectionProps> = ({ tasks }) => {
  const { selectedDate } = useUIStore();

  // Helper function to convert any date format to Date object
  const convertToDate = (date: any): Date => {
    if (date && typeof date === 'object' && 'seconds' in date) {
      // Handle Firestore Timestamp
      return new Date(date.seconds * 1000);
    }
    return new Date(date);
  };

  // Helper function to check if a date is today
  const isToday = (dateToCheck: any) => {
    const today = new Date();
    const checkDate = convertToDate(dateToCheck);
    return (
      checkDate.getFullYear() === today.getFullYear() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getDate() === today.getDate()
    );
  };

  // Get today's tasks and sort by priority
  const getTodaysTasks = () => {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return tasks
      .filter((task) => {
        const taskDate = convertToDate(task.dueDate);
        return isToday(taskDate);
      })
      .sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  };

  // Get tasks for a specific date and sort by priority
  const getTasksForDate = (date: Date | null = new Date()) => {
    if (!date) return [];
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return tasks
      .filter((task) => {
        const taskDate = convertToDate(task.dueDate);
        const compareDate = convertToDate(date);
        return (
          taskDate.getFullYear() === compareDate.getFullYear() &&
          taskDate.getMonth() === compareDate.getMonth() &&
          taskDate.getDate() === compareDate.getDate()
        );
      })
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  // Get the tasks to display based on selected date
  const getDisplayTasks = () => {
    if (selectedDate && !isToday(selectedDate)) {
      return getTasksForDate(selectedDate);
    }
    return getTodaysTasks();
  };

  const getDisplayDate = () => {
    if (selectedDate && !isToday(selectedDate)) {
      return selectedDate;
    }
    return new Date();
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
          ({displayDate.toLocaleDateString()})
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
