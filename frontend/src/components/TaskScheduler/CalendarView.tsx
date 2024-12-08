"use client";

import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../css/AaryaCalendar.css";
import { Task } from "@/types/taskTypes";

// Define Task interface


// Define props interface
interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const [date, setDate] = useState<Date | null>(new Date());

  // Helper function to check if a date is today
  const isToday = (dateToCheck: Date) => {
    const today = new Date();
    return (
      dateToCheck.getFullYear() === today.getFullYear() &&
      dateToCheck.getMonth() === today.getMonth() &&
      dateToCheck.getDate() === today.getDate()
    );
  };

  // Get today's tasks and sort by priority
  const getTodaysTasks = () => {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return tasks
      .filter((task) => {
        const taskDate = new Date(task.dueDate as Date);
        return isToday(taskDate);
      })
      .sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  };

  // Get tasks for selected date and sort by priority
  const getTasksForDate = (selectedDate: Date | null) => {
    if (!selectedDate) return [];
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return tasks
      .filter((task) => {
        const taskDate = new Date(task.dueDate as Date);
        return (
          taskDate.getFullYear() === selectedDate.getFullYear() &&
          taskDate.getMonth() === selectedDate.getMonth() &&
          taskDate.getDate() === selectedDate.getDate()
        );
      })
      .sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  };

  // Modify the onChange handler to match the library's expected signature
  const handleDateChange = (
    value: Date | Date[] | null,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (value instanceof Date) {
      setDate(value);
    } else if (Array.isArray(value) && value.length > 0) {
      setDate(value[0]);
    } else {
      setDate(null);
    }
  };

  // Helper function to determine task indicator color
  const getTaskIndicatorColor = (status: Task["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "In Progress":
        return "bg-blue-500";
      case "Pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-300";
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "High":
        return "text-red-500";
      case "Medium":
        return "text-yellow-500";
      case "Low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  // Custom tile content to add task indicators
  const tileContent = ({ date: tileDate, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayTasks = getTasksForDate(tileDate);
      if (dayTasks.length > 0) {
        return (
          <div className="task-indicator-container">
            {dayTasks.map((task) => (
              <span
                key={task.id}
                className={`task-indicator ${getTaskIndicatorColor(task.status)}`}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const todaysTasks = getTodaysTasks();
  const selectedDateTasks = date ? getTasksForDate(date) : [];

  return (
    <div className="aarya-calendar-container">
      {/* Today's Tasks Section */}
      <div className="task-list-section mb-6">
        <h3 className="task-list-title flex items-center">
          <span className="text-blue-500 mr-2">Today's Tasks</span>
          <span className="text-sm text-gray-400">
            ({new Date().toLocaleDateString()})
          </span>
        </h3>
        {todaysTasks.length > 0 ? (
          <ul className="task-list">
            {todaysTasks.map((task) => (
              <li key={task.id} className="task-list-item">
                <div className="flex items-center space-x-2">
                  <div className={`font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </div>
                  <span className="task-title">{task.title}</span>
                </div>
                <span
                  className={`task-status ${
                    task.status === "Completed"
                      ? "status-completed"
                      : task.status === "In Progress"
                      ? "status-in-progress"
                      : "status-pending"
                  }`}
                >
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-tasks-message">No tasks for today.</p>
        )}
      </div>

      {/* Calendar Section */}
      <div className="calendar-wrapper">
        <Calendar
          onChange={handleDateChange as any}
          value={date}
          view="month"
          tileContent={tileContent}
          className="aarya-calendar"
          prevLabel={<span className="nav-icon">←</span>}
          nextLabel={<span className="nav-icon">→</span>}
        />
      </div>
    </div>
  );
};

export default CalendarView;
