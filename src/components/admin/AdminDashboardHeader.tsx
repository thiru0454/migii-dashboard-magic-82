
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface AdminDashboardHeaderProps {
  onLogout: () => void;
}

export function AdminDashboardHeader({ onLogout }: AdminDashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage workers, businesses and handle support requests
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
        <Button variant="destructive" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
