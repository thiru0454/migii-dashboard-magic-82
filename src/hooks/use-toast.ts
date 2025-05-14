
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

export const toast = {
  success: (title: string, options?: Omit<ToastProps, "title" | "variant">) => {
    return toast({
      ...options,
      title,
      variant: "default",
    });
  },
  error: (title: string, options?: Omit<ToastProps, "title" | "variant">) => {
    return toast({
      ...options,
      title,
      variant: "destructive",
    });
  },
};
