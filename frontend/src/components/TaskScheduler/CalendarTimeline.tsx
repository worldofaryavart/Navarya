import React from 'react';
import { Task, FirestoreTimestamp } from '@/types/taskTypes';
import { useUIStore } from '@/store/uiStateStore';
import { formatDateToDisplay, parseDateFromDisplay } from '@/utils/dateUtils';

interface CalendarTimelineProps {
  tasks: Task[];
}

const CalendarTimeline: React.FC<CalendarTimelineProps> = ({ tasks }) => {
  const { selectedDate } = useUIStore();
  const hours = Array.from({ length: 24 }, (_, i) => i);

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
    return date1.toDateString() === date2.toDateString();
  };

  // Helper function to check if a date is today
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    return isSameDay(date, new Date());
  };

  // Get tasks for the selected date
  const getSelectedDateTasks = () => {
    const compareDate = selectedDate ? convertToDate(selectedDate) : new Date();
    return tasks.filter(task => {
      const taskDate = convertToDate(task.dueDate);
      return taskDate && isSameDay(taskDate, compareDate);
    });
  };

  const getTasksForHour = (hour: number) => {
    const selectedDateTasks = getSelectedDateTasks();
    return selectedDateTasks.filter(task => {
      const taskDate = convertToDate(task.dueDate);
      return taskDate && taskDate.getHours() === hour;
    });
  };

  const displayDate = selectedDate ? convertToDate(selectedDate) : new Date();

  return (
    <div className="rounded-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-200 mr-2">
          {isToday(displayDate) ? "Today's Timeline" : "Timeline"}
        </h2>
        <span className="text-sm text-gray-400">
          ({formatDateToDisplay(displayDate.toISOString())})
        </span>
      </div>
      <div className="space-y-2">
        {hours.map((hour) => {
          const hourTasks = getTasksForHour(hour);
          const formattedHour = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
          
          return (
            <div key={hour} className="flex items-start gap-4">
              <div className="w-16 text-sm text-gray-400">{formattedHour}</div>
              <div className="flex-1 min-h-[2.5rem] border-l-2 border-gray-700 pl-4">
                <div className="flex flex-row gap-2 overflow-x-auto pb-2">
                  {hourTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-blue-500/20 rounded p-2 flex-shrink-0 border border-blue-500/30 max-w-[200px]"
                    >
                      <h3 className="text-sm font-medium text-blue-300 truncate">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-gray-300 truncate">{task.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarTimeline;
