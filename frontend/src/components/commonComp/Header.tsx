'use client';

import React from 'react';
import { FiMenu } from 'react-icons/fi';
import { useSidebar } from '@/context/SidebarContext';

const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4 z-50">
      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-800 rounded-lg transition-colors mr-4"
      >
        <FiMenu size={24} className="text-gray-400" />
      </button>
      <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
        NavArya
      </h1>
    </header>
  );
};

export default Header;