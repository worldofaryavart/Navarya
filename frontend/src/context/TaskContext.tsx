'use client';

import { Task } from "@/types/taskTypes";
import { getTasks } from "@/services/task_services/tasks";
import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback, useRef } from "react";
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
    const lastFetchTime = useRef<number>(0);
    const FETCH_COOLDOWN = 60000; // 1 minute cooldown

    const fetchTasks = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && now - lastFetchTime.current < FETCH_COOLDOWN) {
            console.log('Skipping fetch due to cooldown');
            return;
        }
        
        if (isLoading || !user) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            console.log('Fetching tasks from API');
            const fetchedTasks = await getTasks();
            setTasks(fetchedTasks);
            lastFetchTime.current = now;
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
            fetchTasks(true); // Force fetch on initial load
        }
    }, [user, authLoading]); // Remove fetchTasks from dependencies

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