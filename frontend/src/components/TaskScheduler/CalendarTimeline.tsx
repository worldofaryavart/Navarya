import React from 'react';
import { Task } from '@/types/taskTypes';

interface CalendarTimelineProps {
  tasks: Task[];
}

const CalendarTimeline: React.FC<CalendarTimelineProps> = ({ tasks }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const todayTasks = tasks.filter(task => {
    const today = new Date();
    const taskDate = task.dueDate ? new Date(task.dueDate.seconds * 1000) : new Date();
    return taskDate.toDateString() === today.toDateString();
  });

  const getTasksForHour = (hour: number) => {
    return todayTasks.filter(task => {
      const taskDate = task.dueDate ? new Date(task.dueDate.seconds * 1000) : new Date();
      return taskDate.getHours() === hour;
    });
  };

  return (
    <div className="rounded-lg p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">Today&apos;s Timeline</h2>
      <div className="space-y-2">
        {hours.map((hour) => {
          const hourTasks = getTasksForHour(hour);
          const formattedHour = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
          
          return (
            <div key={hour} className="flex items-start gap-4">
              <div className="w-16 text-sm text-gray-400">{formattedHour}</div>
              <div className="flex-1 min-h-[2rem] border-l-2 border-gray-700 pl-4">
                {hourTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-blue-500/20 rounded p-2 mb-2 border border-blue-500/30"
                  >
                    <h3 className="text-sm font-medium text-blue-300">{task.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarTimeline;
