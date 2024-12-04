"use client";

import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-grow overflow-hidden ml-16">
        <header className="bg-gray-800 border-b border-gray-900 shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-100">AaryaI</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Add additional header actions here */}
          </div>
        </header>

        <main className="flex-grow bg-gray-900 overflow-auto p-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
