import React from 'react';
import './Toast.css';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  duration = 3000
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const toastClass = [
    'toast',
    `toast-${type}`
  ].join(' ');

  return (
    <div className={toastClass}>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        &times;
      </button>
    </div>
  );
};

export default Toast;