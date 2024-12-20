"use client";
import { useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import Sidebar from "./Sidebar";
import AIControlButton from "./AIControlButton";
import Header from "./Header";
import { Task } from "@/types/taskTypes";
import { EVENTS, getTasks } from "@/utils/stateManager";
import { useLayout } from "@/context/LayoutContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { isSidebarOpen } = useLayout();

  useEffect(() => {
    // Initial load
    getTasks().then(setTasks);

    // Listen for updates
    const handleTasksUpdate = (event: CustomEvent<Task[]>) => {
      setTasks(event.detail);
    };

    window.addEventListener(EVENTS.TASKS_UPDATED, handleTasksUpdate as EventListener);

    return () => {
      window.removeEventListener(EVENTS.TASKS_UPDATED, handleTasksUpdate as EventListener);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar tasks={tasks} />
      <div 
        className={`
          flex flex-col flex-grow overflow-hidden ml-16
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'mr-96' : 'mr-0'}
        `}
      >
        <Header />
        <main className="flex-grow bg-gray-900 overflow-auto p-0">
          {children}
        </main>
        <AIControlButton />
      </div>
    </div>
  );
};

export default Layout;