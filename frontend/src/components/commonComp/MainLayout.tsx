'use client';

import React from 'react';
import { useLayout } from '@/context/LayoutContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAISidebarOpen } = useLayout();

  return (
    <div
      className={`
        min-h-screen transition-all duration-300 ease-in-out
        ${isAISidebarOpen ? 'mr-96' : 'mr-0'}
      `}
    >
      {children}
    </div>
  );
};

export default MainLayout;
