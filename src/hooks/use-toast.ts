import { toast as sonnerToast, type ToastT } from "sonner";

export type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  id?: string;
  [key: string]: any;
};

// Array to keep track of created toasts for the toaster component
const toasts: ToastProps[] = [];

export function toast(props: ToastProps) {
  const { title, description, ...rest } = props;
  
  // Create unique ID if not provided
  const id = rest.id || Date.now().toString();
  
  // Keep track of the toast for the toaster component
  const newToast = {
    id,
    title,
    description,
    ...rest
  };
  
  toasts.push(newToast);
  
  // Limit stored toasts to most recent 5
  if (toasts.length > 5) {
    toasts.shift();
  }
  
  // Use sonner's toast functionality
  return sonnerToast(title || "", {
    id,
    description,
    ...rest,
  });
}

export const useToast = () => {
  return {
    toast,
    toasts, // Return the toasts array so it's available to components
  };
};
