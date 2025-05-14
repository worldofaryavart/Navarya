"use client";

import { AICommandProvider } from '@/context/AICommandContext';
import { TaskProvider } from '@/context/TaskContext';
import { ReactNode } from 'react';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <TaskProvider>
            <AICommandProvider>
                {children}
            </AICommandProvider>
        </TaskProvider>
    );
};