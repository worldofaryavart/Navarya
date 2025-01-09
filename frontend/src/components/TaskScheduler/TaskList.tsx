"use client";

import React, { useState, useEffect } from "react";
import {
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Activity,
  Bell,
  X,
} from "lucide-react";
import { Task } from "@/types/taskTypes";
import { Reminder } from "@/types/reminderTypes";
import { useReminderSystem } from "@/hooks/useReminderSystem";
import { useUIStore } from "@/store/uiStateStore";

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
}) => {
  const { taskFilter, searchQuery } = useUIStore();
  const { reminders, handleCompleteReminder } = useReminderSystem();

  // Filter tasks based on all criteria
  const filteredTasks = tasks.filter(task => {
    // Apply status filter
    if (taskFilter.status && taskFilter.status !== 'All') {
      if (task.status !== taskFilter.status) return false;
    }

    // Apply priority filter
    if (taskFilter.priority && taskFilter.priority !== 'All') {
      if (task.priority !== taskFilter.priority) return false;
    }

    // Apply due date filter
    if (taskFilter.due) {
      // Implement due date filtering logic based on your needs
      // Example: today, this week, this month, etc.
    }

    // Apply created date filter
    if (taskFilter.created) {
      // Implement created date filtering logic based on your needs
    }

    // Apply search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        (task.description?.toLowerCase() || '').includes(searchLower)
      );
    }

    return true;
  });

  // Get reminder for a specific task
  const getTaskReminder = (task: Task) => {
    // Match reminder based on task title or description
    return reminders.find(reminder => 
      !reminder.is_completed && 
      (reminder.task.includes(task.title) || 
       (task.description && reminder.task.includes(task.description)))
    );
  };

  // Format date
  const formatDate = (date: any) => {
    if (!date) return 'No due date';
    
    // Handle Firestore Timestamp
    if (typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    
    // Handle string date
    return new Date(date).toLocaleDateString();
  };

  // Format reminder time
  const formatReminderTime = (reminder: Reminder) => {
    if (!reminder.reminder_time) return '';
    const time = new Date(reminder.reminder_time);
    return time.toLocaleString('en-US', { 
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
  };

  // Status change handler
  const handleStatusChange = (task: Task, newStatus: Task["status"]) => {
    const updatedTask = { ...task, status: newStatus };
    onUpdateTask(updatedTask);
  };

  // Render status badge
  const renderStatusBadge = (status: Task["status"]) => {
    const statusConfig = {
      Pending: {
        icon: <Clock className="text-yellow-500" />,
        color: "bg-yellow-100 text-yellow-800",
      },
      "In Progress": {
        icon: <Activity className="text-blue-500" />,
        color: "bg-blue-100 text-blue-800",
      },
      Completed: {
        icon: <CheckCircle className="text-green-500" />,
        color: "bg-green-100 text-green-800",
      },
    };

    // Default config if status doesn't match
    const defaultConfig = {
      icon: <Clock className="text-gray-500" />,
      color: "bg-gray-100 text-gray-800",
    };

    const config = statusConfig[status] || defaultConfig;
    return (
      <div
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        <span className="ml-1">{status}</span>
      </div>
    );
  };

  // Render priority indicator
  const renderPriorityIndicator = (priority: Task["priority"]) => {
    const priorityColors = {
      Low: "bg-green-500",
      Medium: "bg-yellow-500",
      High: "bg-red-500",
    };

    return (
      <div
        className={`w-2 h-2 rounded-full ${priorityColors[priority]}`}
        title={`${priority} Priority`}
      />
    );
  };

  const handleMarkAsRead = async (reminder: Reminder) => {
    try {
      await handleCompleteReminder(reminder.id);
    } catch (error) {
      console.error('Error marking reminder as read:', error);
    }
  };

  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  return (
    <div className="bg-gray-900 shadow-xl rounded-lg overflow-hidden border border-gray-800">
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
        {/* Header with Title and Search */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-100">Task List</h2>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => {}}
              className="w-full px-3 py-1 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-1 flex-wrap">
          {["All", "Pending", "In Progress", "Completed"].map((status) => (
            <button
              key={status}
              onClick={() => {}}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200
                ${
                  taskFilter.status === status
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {tasks.length === 0 ? "No tasks available. Start adding tasks!" : "No tasks match your search criteria."}
        </div>
      ) : (
        <ul className="divide-y divide-gray-700 overflow-y-auto bg-gray-900"
          style={{ minHeight: '475px', maxHeight: '475px' }}>
          {filteredTasks.map((task) => (
            <li
              key={task.id}
              className="px-6 py-4 hover:bg-gray-800 transition-colors duration-200"
            >
              {/* Top row: Title and Status/Edit icons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {renderPriorityIndicator(task.priority)}
                  <h3 className="text-lg font-medium text-gray-100">{task.title}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  {renderStatusBadge(task.status)}
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1 hover:bg-gray-700 rounded-full transition-colors duration-200"
                    title="Edit task"
                  >
                    <Edit2 className="w-4 h-4 text-blue-400" />
                  </button>
                  {getTaskReminder(task) && (
                    <div className="relative">
                      <button
                        onClick={() => setSelectedReminder(getTaskReminder(task) || null)}
                        className={`p-1 hover:bg-gray-700 rounded-full transition-colors duration-200 ${
                          getTaskReminder(task)?.is_due ? 'animate-pulse' : ''
                        }`}
                        title="View reminder"
                      >
                        <Bell className={`w-4 h-4 ${
                          getTaskReminder(task)?.is_due ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                      </button>
                      {selectedReminder && selectedReminder.task.includes(task.title) && (
                        <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg p-3 z-10 border border-gray-700">
                          <div className="text-sm text-gray-300">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-yellow-400" />
                                <span>Reminder</span>
                                {selectedReminder.is_due && (
                                  <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">
                                    Due
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedReminder(null)}
                                className="p-1 hover:bg-gray-700 rounded-full"
                              >
                                <X className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-400">
                              {formatReminderTime(selectedReminder)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {selectedReminder.task}
                            </p>
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => handleMarkAsRead(selectedReminder)}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors duration-200 flex items-center space-x-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Mark as complete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Middle row: Description */}
              <p className="text-sm text-gray-400 mt-2">
                {task.description.length > 50
                  ? `${task.description.substring(0, 50)}...`
                  : task.description}
              </p>

              {/* Bottom row: Due date and Status dropdown */}
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-gray-400">
                {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value as Task["status"])}
                    className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200"
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
