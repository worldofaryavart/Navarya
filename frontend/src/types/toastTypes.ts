export interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'reminder';
    duration?: number;
    onClose?: () => void;
    title?: string;
  }