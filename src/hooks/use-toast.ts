
import { useState } from "react";
import { toast } from "sonner";

// Define types for toast functionality
type ToastProps = Parameters<typeof toast>[0] & {
  id?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

// Create a hook for accessing toast functionality
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (props: ToastProps) => {
    const id = toast(props);
    
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
