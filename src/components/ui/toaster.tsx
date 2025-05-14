
import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div>
      {toasts.map((toast) => (
        <div key={toast.id}>
          {toast.title && <div>{toast.title}</div>}
          {toast.description && <div>{toast.description}</div>}
        </div>
      ))}
    </div>
  );
}
