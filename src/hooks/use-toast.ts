
import { toast as sonnerToast, Toast, ToastOptions } from "sonner";

export type ToastProps = ToastOptions & {
  title?: string;
  description?: string;
};

export function toast(props: ToastProps) {
  if (typeof props === "string") {
    return sonnerToast(props);
  }

  const { title, description, ...rest } = props;
  
  return sonnerToast(title || "", {
    ...rest,
    description,
  });
}

export const useToast = () => {
  return {
    toast,
  };
};
