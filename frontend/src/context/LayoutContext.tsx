'use client';

import React, { createContext, useContext, useState } from 'react';

interface LayoutContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <LayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
