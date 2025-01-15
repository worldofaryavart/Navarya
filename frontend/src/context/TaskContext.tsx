'use client';

import { Task } from "@/types/taskTypes";
import { getTasks } from "@/utils/tasks/tasks";
import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

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
    const { user, loading: authLoading } = useAuth();

    const fetchTasks = useCallback(async () => {
        if (isLoading || !user) return; // Don't fetch if loading or no user
        
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
    }, [isLoading, user]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchTasks();
        }
    }, [fetchTasks, user, authLoading]); // Fetch when auth state changes

    const value = {
        tasks,
        setTasks,
        fetchTasks,
        isLoading: isLoading || authLoading,
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