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
  status: "Pending" | "In Progress" | "Completed";
}

// Define props interface
interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const [date, setDate] = useState<Date | null>(new Date());

  // Modify the onChange handler to match the library's expected signature
  const handleDateChange = (
    value: Date | Date[] | null,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    // Handle single date selection
    if (value instanceof Date) {
      setDate(value);
    }
    // Optionally handle array of dates if your calendar supports multiple date selection
    else if (Array.isArray(value) && value.length > 0) {
      setDate(value[0]);
    }
    // Handle null case if needed
    else {
      setDate(null);
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
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateString = date.toISOString().split("T")[0];
      const dayTasks = tasks.filter((task) => task.dueDate === dateString);

      if (dayTasks.length > 0) {
        return (
          <div className="task-indicator-container">
            {dayTasks.map((task) => (
              <span
                key={task.id}
                className={`task-indicator ${getTaskIndicatorColor(
                  task.status
                )}`}
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
          onChange={handleDateChange as any}
          value={date}
          view="month"
          tileContent={tileContent}
          className="aarya-calendar"
          prevLabel={<span className="nav-icon">&#8592;</span>}
          nextLabel={<span className="nav-icon">&#8594;</span>}
        />
      </div>

      <div className="task-list-section">
        <h3 className="task-list-title">
          Tasks for {date ? date.toLocaleDateString() : "Selected Date"}
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
