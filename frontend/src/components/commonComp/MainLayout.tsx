'use client';

import React from 'react';
import { useLayout } from '@/context/LayoutContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isSidebarOpen } = useLayout();

  return (
    <div
      className={`
        min-h-screen transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'mr-96' : 'mr-0'}
      `}
    >
      {children}
    </div>
  );
};

export default MainLayout;
