import { ToastProps } from "@/types/toastTypes";
import { useEffect, useState } from "react";

const Toast: React.FC<ToastProps> = ({ 
    message, 
    type = 'success', 
    duration = 10000, 
    onClose 
  }) => {
    const [isVisible, setIsVisible] = useState(true);
  
    useEffect(() => {
      // Play sound when toast appears
      const audio = new Audio('/notification-beep-229154.mp3');
      audio.play();
  
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
  
      return () => clearTimeout(timer);
    }, [duration, onClose]);
  
    if (!isVisible) return null;
  
    const typeStyles = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500'
    };
  
    return (
      <div 
        className={`fixed top-4 right-4 z-50 p-4 text-white rounded shadow-lg ${typeStyles[type]} 
        transition-all duration-300 ease-in-out`}
      >
        {message}
      </div>
    );
  };
  
  export default Toast;