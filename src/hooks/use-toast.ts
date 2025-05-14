
import { useState } from "react";
import { toast } from "sonner";

// Define types for toast functionality
type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

// Create a hook for accessing toast functionality
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (props: ToastProps) => {
    // Use the toast function from sonner
    const id = props.id || String(Math.random());
    
    toast(props.title as string, {
      description: props.description,
      action: props.action,
    });
    
    const newToast = {
      ...props,
      id
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    return id;
  };

  const dismissToast = (id: string | number) => {
    toast.dismiss(id);
    setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id));
  };

  return {
    toast: showToast,
    dismiss: dismissToast,
    toasts
  };
}

export { toast };
