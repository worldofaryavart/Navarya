"use client";

import { Task } from "@/types/taskTypes";
import { getTasks } from "@/services/task_services/tasks";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/hooks/useAuth";

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  fetchTasks: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const FETCH_COOLDOWN = 120000; // 2 minutes in milliseconds

  const fetchTasks = useCallback(async () => {
    if (!user) return;  // Avoid fetching if there's no logged in user

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching tasks from API");
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch tasks";
      setError(errorMessage);
      console.error("Failed to fetch tasks: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Only run if user is available and auth is finished loading
    if (!authLoading && user) {
      // Fetch immediately on mount
      fetchTasks();

      // Set up an interval to fetch tasks every 2 minutes
      // const interval = setInterval(() => {
      //   fetchTasks();
      // }, FETCH_COOLDOWN);

      // // Cleanup on unmount
      // return () => clearInterval(interval);
    }
  }, [authLoading, user, fetchTasks]);

  const value = {
    tasks,
    setTasks,
    fetchTasks,
    isLoading,
    error,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
