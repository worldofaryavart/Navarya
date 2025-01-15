"use client";
import { useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import Sidebar from "./Sidebar";
import AIControlButton from "../AIController/AIControlButton";
import Header from "./Header";
import { Task } from "@/types/taskTypes";
import { useLayout } from "@/context/LayoutContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isSidebarOpen } = useLayout();

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <div 
        className={`
          flex-grow transition-all duration-300
          ${isSidebarOpen ? 'pl-16' : ''}
        `}
      >
        <Header />
        <main className="flex-grow overflow-auto p-0">
          {children}
        </main>
        <AIControlButton />
      </div>
    </div>
  );
};

export default Layout;