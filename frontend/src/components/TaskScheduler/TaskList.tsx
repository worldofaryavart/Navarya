"use client";

import React, { useState } from "react";
import {
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Activity,
} from "lucide-react";
import { Task } from "@/types/taskTypes";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Task["status"] | "All">("All");

  const filteredTasks = tasks
    .sort((a, b) => {
      // Sort by creation time (newest first)
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    })
    .filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

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
              onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => setStatusFilter(status as Task["status"] | "All")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200
                ${
                  statusFilter === status
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
