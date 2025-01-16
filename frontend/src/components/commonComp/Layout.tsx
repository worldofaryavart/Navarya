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

const Layout = ({ children }: LayoutProps) => {
  const { isSidebarOpen } = useLayout();

  return (
    <div className="flex min-h-screen ">
      <Sidebar />
      <div 
        className={`
          flex-1 flex flex-col min-h-screen
          transition-all duration-300
          ${isSidebarOpen ? 'pl-16' : ''}
        `}
      >
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <AIControlButton />
      </div>
    </div>
  );
};

export default Layout;