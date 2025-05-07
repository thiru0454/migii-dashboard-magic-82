
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className={cn(
        "flex-1 p-4 md:p-6 pt-4 transition-all duration-300",
        "ml-0 md:ml-16 lg:ml-64",
        "mt-16 md:mt-0", // Add top margin on mobile for the header
        "bg-gradient-to-br from-background to-background/80 via-background/95"
      )}>
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
