import React from 'react';
import { Task } from '@/types/taskTypes';
import { useUIStore } from '@/store/uiStateStore';

interface CalendarTimelineProps {
  tasks: Task[];
}

const CalendarTimeline: React.FC<CalendarTimelineProps> = ({ tasks }) => {
  const { selectedDate } = useUIStore();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper function to convert any date format to Date object
  const convertToDate = (date: any): Date => {
    if (date && typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }
    return new Date(date);
  };

  // Helper function to check if a date is today
  const isToday = (dateToCheck: Date) => {
    const today = new Date();
    return dateToCheck.toDateString() === today.toDateString();
  };

  // Get tasks for the selected date
  const getSelectedDateTasks = () => {
    return tasks.filter(task => {
      const taskDate = convertToDate(task.dueDate);
      const compareDate = selectedDate || new Date();
      return taskDate.toDateString() === compareDate.toDateString();
    });
  };

  const getTasksForHour = (hour: number) => {
    const selectedDateTasks = getSelectedDateTasks();
    return selectedDateTasks.filter(task => {
      const taskDate = convertToDate(task.dueDate);
      return taskDate.getHours() === hour;
    });
  };


  const displayDate = selectedDate || new Date();

  return (
    <div className="rounded-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-200 mr-2">
          {isToday(displayDate) ? "Today's Timeline" : "Timeline"}
        </h2>
        <span className="text-sm text-gray-400">
          ({displayDate.toLocaleDateString()})
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
                      <p className="text-xs text-gray-300 truncate">{task.description}</p>
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
