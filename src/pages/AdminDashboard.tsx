
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Building } from "lucide-react";
import { useAppAuth } from "@/contexts/AuthContext";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { WorkersTab } from "@/components/admin/WorkersTab";
import { BusinessesTab } from "@/components/admin/BusinessesTab";
import { HelpRequestsTab } from "@/components/admin/HelpRequestsTab";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("workers");
  const { logout } = useAppAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminDashboardHeader onLogout={logout} />

        <Tabs defaultValue="workers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="workers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Worker Database</span>
              <span className="sm:hidden">Workers</span>
            </TabsTrigger>
            <TabsTrigger value="businesses" className="gap-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Business Users</span>
              <span className="sm:hidden">Businesses</span>
            </TabsTrigger>
            <TabsTrigger value="help-requests" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Help Requests</span>
              <span className="sm:hidden">Help</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="workers">
            <WorkersTab />
          </TabsContent>
          
          <TabsContent value="businesses">
            <BusinessesTab />
          </TabsContent>
          
          <TabsContent value="help-requests">
            <HelpRequestsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
