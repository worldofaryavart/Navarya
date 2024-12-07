import { Task } from "@/types/taskTypes";
import { getTasks } from "@/utils/tasks";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface TaskContextType {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    fetchTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{children: ReactNode }> = ({ children }) => {
    const [tasks, setTasks ] = useState<Task[]>([]);

    const fetchTasks = async () => {
        try{
            const fetchedTasks = await getTasks();
            setTasks(fetchedTasks);
        } catch (error) {
            console.error("Failed to fetch tasks: ", error);
        }
    };

    useEffect(() => {
        fetchTasks();
    },[]);

    return (
        <TaskContext.Provider value ={{ tasks, setTasks, fetchTasks }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if ( context === undefined) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
};