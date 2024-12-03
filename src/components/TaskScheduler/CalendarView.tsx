"use client";

import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../css/AaryaCalendar.css";

// Define Task interface
interface Task {
  id: number | string;
  title: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

// Define props interface
interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const [date, setDate] = useState<Date | null>(new Date());

  // Type-safe onChange handler
  const handleDateChange = (newDate: Date | null) => {
    // Ensure newDate is not null and is a Date
    if (newDate) {
      setDate(newDate);
    }
  };

  // Filter tasks for the selected date
  const tasksForSelectedDate = tasks.filter((task) => {
    // Ensure date is a valid Date object before converting
    if (date) {
      return task.dueDate === date.toISOString().split("T")[0];
    }
    return false;
  });

  // Helper function to determine task indicator color
  const getTaskIndicatorColor = (status: Task['status']) => {
    switch (status) {
      case "Completed": return "bg-green-500";
      case "In Progress": return "bg-blue-500";
      case "Pending": return "bg-yellow-500";
      default: return "bg-gray-300";
    }
  };

  // Custom tile content to add task indicators
  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      const dayTasks = tasks.filter(task => task.dueDate === dateString);
      
      if (dayTasks.length > 0) {
        return (
          <div className="task-indicator-container">
            {dayTasks.map(task => (
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
    <div className="aarya-calendar-container">
      <div className="calendar-wrapper">
        <Calendar
          onChange={handleDateChange}
          value={date}
          view="month"
          tileContent={tileContent}
          className="aarya-calendar"
          // Custom navigation labels for previous/next month
          prevLabel={<span className="nav-icon">&#8592;</span>}
          nextLabel={<span className="nav-icon">&#8594;</span>}
        />
      </div>

      <div className="task-list-section">
        <h3 className="task-list-title">
          Tasks for {date ? date.toLocaleDateString() : 'Selected Date'}
        </h3>
        {tasksForSelectedDate.length > 0 ? (
          <ul className="task-list">
            {tasksForSelectedDate.map((task) => (
              <li key={task.id} className="task-list-item">
                <span className="task-title">{task.title}</span>
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
          <p className="no-tasks-message">No tasks for this day.</p>
        )}
      </div>
    </div>
  );
};

export default CalendarView;