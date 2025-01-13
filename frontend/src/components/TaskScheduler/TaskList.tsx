"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Task } from "@/types/taskTypes";
import { useUIStore } from "@/store/uiStateStore";
import { useReminderChecker } from "@/hooks/useReminderChecker";
import { TaskCard } from "./TaskCard";

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

  // Initialize reminder checker
  useReminderChecker(tasks);

  // Filter tasks based on all criteria
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Helper function to convert any date format to Date object
      const convertToDate = (date: any): Date | null => {
        if (!date) return null;
        
        if (date instanceof Date) {
          return date;
        }
        
        if (typeof date === 'object' && 'seconds' in date) {
          return new Date(date.seconds * 1000);
        }
        
        if (typeof date === 'string') {
          const parsed = new Date(date);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        
        return null;
      };

      // Apply status filter
      if (taskFilter.status && taskFilter.status !== 'All') {
        const statusArray = taskFilter.status.split('|').map(s => s.trim().toLowerCase());
        if (!statusArray.includes(task.status.toLowerCase())) return false;
      }

      // Apply priority filter
      if (taskFilter.priority && taskFilter.priority !== 'All') {
        if (task.priority !== taskFilter.priority) return false;
      }

      // Apply due date filter
      if (taskFilter.due) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);
        
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const dueDate = convertToDate(task.dueDate);
        if (!dueDate) return false;

        // Handle specific date (format: YYYY-MM-DD)
        if (taskFilter.due.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const specificDate = new Date(taskFilter.due);
          const nextDate = new Date(specificDate);
          nextDate.setDate(nextDate.getDate() + 1);
          
          if (!isNaN(specificDate.getTime())) {
            return dueDate >= specificDate && dueDate < nextDate;
          }
          return false;
        }

        // Handle relative dates
        switch (taskFilter.due) {
          case 'today':
            if (!(dueDate >= startOfToday && dueDate < endOfToday)) return false;
            break;
          case 'yesterday':
            if (!(dueDate >= startOfYesterday && dueDate < startOfToday)) return false;
            break;
          case 'overdue':
            if (!(dueDate < startOfToday)) return false;
            break;
          case 'upcoming':
            if (!(dueDate >= startOfToday)) return false;
            break;
        }
      }

      // Apply created date filter
      if (taskFilter.created) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);

        const createdDate = convertToDate(task.createdAt);
        if (!createdDate) return false;

        if (taskFilter.created === 'today') {
          if (!(createdDate >= startOfToday && createdDate < endOfToday)) return false;
        } else if (taskFilter.created.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Handle specific date (format: YYYY-MM-DD)
          const specificDate = new Date(taskFilter.created);
          const nextDate = new Date(specificDate);
          nextDate.setDate(nextDate.getDate() + 1);
          
          if (!isNaN(specificDate.getTime())) {
            if (!(createdDate >= specificDate && createdDate < nextDate)) return false;
          } else {
            return false;
          }
        }
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
  }, [tasks, taskFilter, searchQuery]);

  // Sort tasks: Pending first, then by priority, then by due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks go last
    if (a.status === 'Completed' && b.status !== 'Completed') return 1;
    if (a.status !== 'Completed' && b.status === 'Completed') return -1;

    // Sort by priority
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    // Sort by due date
    const aDate = a.dueDate ? new Date(a.dueDate instanceof Date ? a.dueDate : a.dueDate.seconds * 1000) : null;
    const bDate = b.dueDate ? new Date(b.dueDate instanceof Date ? b.dueDate : b.dueDate.seconds * 1000) : null;
    
    if (aDate && bDate) return aDate.getTime() - bDate.getTime();
    if (aDate) return -1;
    if (bDate) return 1;
    
    return 0;
  });

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
        />
      ))}
      {sortedTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks found.
        </div>
      )}
    </div>
  );
};

export default TaskList;
