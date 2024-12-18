'use client';

import { useEffect, useState } from 'react';
import { EVENTS, ToastData } from '@/utils/stateManager';

const ToastManager = () => {
  const [toasts, setToasts] = useState<(ToastData & { id: string })[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent<ToastData>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast = { ...event.detail, id };
      
      setToasts(current => {
        // Remove oldest toast if we have more than 3
        if (current.length >= 3) {
          return [...current.slice(1), newToast];
        }
        return [...current, newToast];
      });

      // Auto remove after duration
      setTimeout(() => {
        setToasts(current => current.filter(t => t.id !== id));
      }, event.detail.duration || 3000);
    };

    window.addEventListener(EVENTS.SHOW_TOAST, handleToast as EventListener);
    return () => window.removeEventListener(EVENTS.SHOW_TOAST, handleToast as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded shadow-lg text-white ${
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'success' ? 'bg-green-500' :
            'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastManager;
