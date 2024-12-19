'use client';

import { Task } from "@/types/taskTypes";
import { getTasks } from "@/utils/tasks";
import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";

interface TaskContextType {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    fetchTasks: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{children: ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        if (isLoading) return; // Prevent multiple simultaneous fetches
        
        setIsLoading(true);
        setError(null);
        
        try {
            const fetchedTasks = await getTasks();
            setTasks(fetchedTasks);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
            setError(errorMessage);
            console.error("Failed to fetch tasks: ", error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    useEffect(() => {
        fetchTasks();
    }, []); // Only fetch on mount

    const value = {
        tasks,
        setTasks,
        fetchTasks,
        isLoading,
        error
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
};