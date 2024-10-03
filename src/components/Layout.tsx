"use client";

import { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'profile' | 'about' | 'vision'>('chat');

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          setCurrentView={setCurrentView}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 shadow-lg p-4 flex justify-between items-center">
          {!isSidebarOpen && (
            <button
              className="text-2xl hover:text-blue-400 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <FiMenu />
            </button>
          )}
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            {currentView === 'chat' ? 'AaryaI Learning' : 'User Profile'}
          </h1>
          <div className="w-8"></div> {/* Placeholder for balance */}
        </header>

        {/* Page Content */}
        <main className="flex-grow bg-gray-100 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
