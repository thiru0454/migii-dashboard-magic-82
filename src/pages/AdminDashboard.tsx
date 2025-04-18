
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { WorkersTab } from "@/components/admin/WorkersTab";
import { BusinessesTab } from "@/components/admin/BusinessesTab";
import { HelpRequestsTab } from "@/components/admin/HelpRequestsTab";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("workers");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminDashboardHeader onLogout={handleLogout} />
        
        <Routes>
          <Route
            path="/*"
            element={
              <Tabs defaultValue="workers" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="workers">Workers</TabsTrigger>
                  <TabsTrigger value="businesses">Businesses</TabsTrigger>
                  <TabsTrigger value="help-requests">Help Requests</TabsTrigger>
                </TabsList>
                <TabsContent value="workers" className="space-y-4">
                  <WorkersTab />
                </TabsContent>
                <TabsContent value="businesses" className="space-y-4">
                  <BusinessesTab />
                </TabsContent>
                <TabsContent value="help-requests" className="space-y-4">
                  <HelpRequestsTab />
                </TabsContent>
              </Tabs>
            }
          />
        </Routes>
      </div>
    </DashboardLayout>
  );
}
