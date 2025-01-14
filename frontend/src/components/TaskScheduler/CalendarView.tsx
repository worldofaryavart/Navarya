"use client";

import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../css/AaryaCalendar.css";
import { Task } from "@/types/taskTypes";
import { useUIStore } from "@/store/uiStateStore";

interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const { selectedDate, setSelectedDate } = useUIStore();

  // Helper function to convert any date format to Date object
  const convertToDate = (date: any): Date => {
    if (date && typeof date === 'object' && 'seconds' in date) {
      return new Date(date.seconds * 1000);
    }
    return new Date(date);
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      const taskDate = convertToDate(task.dueDate);
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      );
    });
  };

  // Handle date change
  const handleDateChange = (
    value: Date | Date[] | null,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value.length > 0) {
      setSelectedDate(value[0]);
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

  return (
    <div className="calendar-wrapper">
      <Calendar
        onChange={handleDateChange as any}
        value={selectedDate}
        view="month"
        tileContent={tileContent}
        className="aarya-calendar"
        prevLabel={<span className="nav-icon">←</span>}
        nextLabel={<span className="nav-icon">→</span>}
      />
    </div>
  );
};

export default CalendarView;
