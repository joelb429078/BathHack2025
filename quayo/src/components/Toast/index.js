import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  XCircle,
  X as XIcon
} from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast Types with their respective styles
const TOAST_TYPES = {
  success: {
    icon: CheckCircle2,
    className: 'bg-green-50 border-green-500 text-green-800',
    iconClass: 'text-green-500',
    progressClass: 'bg-green-500'
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 border-red-500 text-red-800',
    iconClass: 'text-red-500',
    progressClass: 'bg-red-500'
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    iconClass: 'text-yellow-500',
    progressClass: 'bg-yellow-500'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-500 text-blue-800',
    iconClass: 'text-blue-500',
    progressClass: 'bg-blue-500'
  }
};
// Toast add in example:
// icon - Lucide(reacts), className - CSS for appearance, iconClass - CSS for icon, progressClass - CSS for colour of animated bar on botttom of Toast


// Individual Toast Component
const Toast = ({ id, message, type = 'info', onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);
  const duration = 3000; // 3 seconds
  const toastStyle = TOAST_TYPES[type];
  const Icon = toastStyle.icon;

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 200); // Match animation duration
  }, [id, onDismiss]);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = endTime - now;
      const newProgress = (remaining / duration) * 100;

      if (newProgress <= 0) {
        handleDismiss();
      } else {
        setProgress(newProgress);
        requestAnimationFrame(updateProgress);
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [duration, handleDismiss]);

  return (
    <div 
      className={`
        relative overflow-hidden mb-2 p-4 rounded-lg border shadow-lg
        transform transition-all duration-200 ease-in-out
        ${toastStyle.className}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${toastStyle.iconClass}`} />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button 
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-black/5 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
        <div 
          className={`h-full ${toastStyle.progressClass} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook to use toasts
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Example usage component
export const ToastExample = () => {
  const { addToast } = useToast();

  return (
    <div className="space-y-2">
      <button
        onClick={() => addToast('Successfully saved!', 'success')}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Show Success
      </button>
      <button
        onClick={() => addToast('Something went wrong!', 'error')}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Show Error
      </button>
      <button
        onClick={() => addToast('Please be careful!', 'warning')}
        className="px-4 py-2 bg-yellow-500 text-white rounded"
      >
        Show Warning
      </button>
      <button
        onClick={() => addToast('Here is some information.', 'info')}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Show Info
      </button>
    </div>
  );
};