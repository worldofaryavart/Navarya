"use client";

import { useRouter } from 'next/navigation';
import { ReactNode, createContext, useContext } from 'react';
import { useTaskContext } from './TaskContext';
import { AICommandHandler } from '@/services/ai_cmd_process/process_cmd';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AICommandContextType {
    processCommand: (userMessage: Message) => Promise<any>;
}

const AICommandContext = createContext<AICommandContextType | undefined>(undefined);

export const AICommandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const router = useRouter();
    const { setTasks, fetchTasks } = useTaskContext();

    const processCommand = async (userMessage: Message) => {
        return AICommandHandler.processCommand(userMessage, router, setTasks, fetchTasks);
    };

    return (
        <AICommandContext.Provider value={{ processCommand }}>
            {children}
        </AICommandContext.Provider>
    );
};

export const useAICommand = () => {
    const context = useContext(AICommandContext);
    if (context === undefined) {
        throw new Error('useAICommand must be used within an AICommandProvider');
    }
    return context;
};