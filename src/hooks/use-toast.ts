
import { useState } from "react";
import { toast as sonnerToast } from "sonner";

// Define types for toast functionality
type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (props: ToastProps) => {
    // Use the toast function from sonner
    const id = props.id || String(Math.random());
    
    sonnerToast(props.title as string, {
      description: props.description,
      action: props.action,
    });
    
    const newToast = {
      ...props,
      id,
    };
    
    setToasts((currentToasts) => [...currentToasts, newToast]);
    
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  return {
    toast: showToast,
    toasts,
    dismissToast,
  };
}

// Create a standalone toast object with methods for different toast types
export const toast = {
  success: (title: string, options?: Omit<ToastProps, "title" | "variant">) => {
    sonnerToast.success(title, options);
    return String(Math.random());
  },
  error: (title: string, options?: Omit<ToastProps, "title" | "variant">) => {
    sonnerToast.error(title, options);
    return String(Math.random());
  },
  // Add a default method to match the showToast function signature
  default: (props: ToastProps) => {
    sonnerToast(props.title as string, {
      description: props.description,
      action: props.action,
    });
    return String(Math.random());
  }
};
