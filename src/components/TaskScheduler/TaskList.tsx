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

// Define Task interface

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Status change handler
  const handleStatusChange = (task: Task, newStatus: Task["status"]) => {
    const updatedTask = { ...task, status: newStatus };
    onUpdateTask(updatedTask);
  };

  // Render status badge
  const renderStatusBadge = (status: Task["status"]) => {
    const statusConfig = {
      Pending: {
        icon: <Clock className="mr-2 text-yellow-500" />,
        color: "bg-yellow-100 text-yellow-800",
      },
      "In Progress": {
        icon: <Activity className="mr-2 text-blue-500" />,
        color: "bg-blue-100 text-blue-800",
      },
      Completed: {
        icon: <CheckCircle className="mr-2 text-green-500" />,
        color: "bg-green-100 text-green-800",
      },
    };

    const config = statusConfig[status];
    return (
      <div
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {status}
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
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h2 className="text-xl font-bold text-gray-800">Task List</h2>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tasks available. Start adding tasks!
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 w-full">
                  {renderPriorityIndicator(task.priority)}

                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800 truncate max-w-[200px]">
                        {task.title}
                      </span>
                      {renderStatusBadge(task.status)}
                    </div>

                    {task.dueDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Due: {formatDate(new Date(task.dueDate))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-ghost btn-sm relative"
                    >
                      <MoreVertical size={20} />
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content flex flex-row p-2 shadow bg-gray-200 rounded-box space-x-2 items-center"
                    >
                      <li className="relative">
                        <button
                          onClick={() => handleStatusChange(task, "Pending")}
                          className="text-yellow-500 p-2 rounded-full hover:bg-gray-300 transition-colors group"
                        >
                          <Clock size={16} />
                          <span
                            className="absolute z-10 -top-8 left-1/2 -translate-x-1/2 
            bg-gray-700 text-white text-xs px-2 py-1 rounded 
            opacity-0 group-hover:opacity-100 transition-opacity 
            pointer-events-none whitespace-nowrap"
                          >
                            Set as Pending
                          </span>
                        </button>
                      </li>
                      <li className="relative">
                        <button
                          onClick={() =>
                            handleStatusChange(task, "In Progress")
                          }
                          className="text-blue-500 p-2 rounded-full hover:bg-gray-300 transition-colors group"
                        >
                          <Activity size={16} />
                          <span
                            className="absolute z-10 -top-8 left-1/2 -translate-x-1/2 
            bg-gray-700 text-white text-xs px-2 py-1 rounded 
            opacity-0 group-hover:opacity-100 transition-opacity 
            pointer-events-none whitespace-nowrap"
                          >
                            Set In Progress
                          </span>
                        </button>
                      </li>
                      <li className="relative">
                        <button
                          onClick={() => handleStatusChange(task, "Completed")}
                          className="text-green-500 p-2 rounded-full hover:bg-gray-300 transition-colors group"
                        >
                          <CheckCircle size={16} />
                          <span
                            className="absolute z-10 -top-8 left-1/2 -translate-x-1/2 
            bg-gray-700 text-white text-xs px-2 py-1 rounded 
            opacity-0 group-hover:opacity-100 transition-opacity 
            pointer-events-none whitespace-nowrap"
                          >
                            Set as Completed
                          </span>
                        </button>
                      </li>
                      <li className="relative">
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="text-red-500 p-2 rounded-full hover:bg-gray-300 transition-colors group"
                        >
                          <Trash2 size={16} />
                          <span
                            className="absolute z-10 -top-8 left-1/2 -translate-x-1/2 
            bg-gray-700 text-white text-xs px-2 py-1 rounded 
            opacity-0 group-hover:opacity-100 transition-opacity 
            pointer-events-none whitespace-nowrap"
                          >
                            Delete Task
                          </span>
                        </button>
                      </li>
                    </ul>
                  </div>
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
