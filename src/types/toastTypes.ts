export interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning';
    duration?: number;
    onClose?: () => void;
  }