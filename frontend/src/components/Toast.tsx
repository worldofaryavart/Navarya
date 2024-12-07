'use client';

import { ToastProps } from "@/types/toastTypes";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaBell, FaTimes } from 'react-icons/fa';

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 5000, 
  onClose,
  title
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Play sound when toast appears
    const audio = new Audio('/notification-beep-229154.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300); // Animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <FaCheckCircle className="w-5 h-5" />,
    error: <FaExclamationCircle className="w-5 h-5" />,
    warning: <FaInfoCircle className="w-5 h-5" />,
    reminder: <FaBell className="w-5 h-5" />
  };

  const styles = {
    success: 'bg-green-100 text-green-800 border-green-500',
    error: 'bg-red-100 text-red-800 border-red-500',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-500',
    reminder: 'bg-blue-100 text-blue-800 border-blue-500'
  };

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50
        ${styles[type]} 
        ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}
        min-w-[320px] max-w-md border-l-4 rounded-lg shadow-lg 
        transform transition-all duration-300
      `}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <p className="text-sm font-medium">{title}</p>
            )}
            <p className="text-sm mt-1">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => {
                setIsExiting(true);
                setTimeout(() => {
                  setIsVisible(false);
                  onClose?.();
                }, 300);
              }}
            >
              <span className="sr-only">Close</span>
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;