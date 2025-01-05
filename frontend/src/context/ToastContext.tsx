'use client';

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import Toast from '@/components/commonComp/Toast';
import { ToastProps } from '@/types/toastTypes';

interface ToastContextType {
  showToast: (props: Omit<ToastProps, 'id' | 'onClose'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 3; // Limit maximum number of simultaneous toasts

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const removeToast = useCallback((id: string) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    
    // Clear the timeout
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
  }, []);

  const showToast = useCallback((props: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...props, id };
    
    setToasts(currentToasts => {
      // Remove oldest toast if we exceed MAX_TOASTS
      if (currentToasts.length >= MAX_TOASTS) {
        const oldestToast = currentToasts[0];
        removeToast(oldestToast.id);
        return [...currentToasts.slice(1), newToast];
      }
      return [...currentToasts, newToast];
    });
    
    // Store timeout reference
    timeoutRefs.current[id] = setTimeout(() => {
      removeToast(id);
    }, props.duration || 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed inset-0 pointer-events-none flex flex-col items-end pt-20 px-4 gap-2 z-50">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
            <Toast {...toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
