
import { useToast } from "@/hooks/use-toast";
import { Toast } from "sonner";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
