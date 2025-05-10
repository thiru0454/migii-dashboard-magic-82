
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkerRequestsList } from "@/components/worker/WorkerRequestsList";
import { WorkerAssignmentTab } from "@/components/worker/WorkerAssignmentTab";
import { WorkerNotificationsTab } from "@/components/worker/WorkerNotificationsTab";
import { T } from "@/components/T";
import { Briefcase, BellRing, ClipboardList } from "lucide-react";

export default function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState<string>("assignments");
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Worker Dashboard</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span>Worker Requests</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Job Assignments</CardTitle>
                <CardDescription>
                  View and manage your assignments from businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkerAssignmentTab />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="requests" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Worker Requests</CardTitle>
                <CardDescription>
                  View requests for workers from businesses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <WorkerRequestsList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-4">
            <WorkerNotificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
