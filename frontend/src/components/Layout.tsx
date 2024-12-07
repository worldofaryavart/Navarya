"use client";
import { TaskProvider, useTaskContext } from "@/context/TaskContext";
import { useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import Sidebar from "./Sidebar";
import AIControlButton from "./AIControlButton";
import Header from "./Header";
import { useReminderSystem } from "@/hooks/useReminderSystem";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeReminders, setActiveReminders] = useState<any[]>([]);
  // Use the context to get tasks
  const { tasks } = useTaskContext();
  

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-grow overflow-hidden ml-16">
        <Header/>
        <main className="flex-grow bg-gray-900 overflow-auto p-0">
          {children}
        </main>
        <AIControlButton />
      </div>
    </div>
  );
};

// Wrap the Layout with TaskProvider
const LayoutWrapper: React.FC<LayoutProps> = (props) => {
  return (
    <TaskProvider>
      <Layout {...props} />
    </TaskProvider>
  );
};

export default LayoutWrapper;