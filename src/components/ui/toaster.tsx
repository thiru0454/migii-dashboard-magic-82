import { useToast } from "@/hooks/use-toast";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <>
      {/* Use the Sonner Toaster for actual toast display */}
      <SonnerToaster />
      
      {/* Keep this for backward compatibility if needed */}
      <div className="hidden">
        {toasts.map((toast) => (
          <div key={toast.id}>
            {toast.title && <div>{toast.title}</div>}
            {toast.description && <div>{toast.description}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
