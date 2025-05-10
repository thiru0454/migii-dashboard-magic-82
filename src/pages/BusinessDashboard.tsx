
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessNotificationsTab } from "@/components/business/BusinessNotificationsTab";
import { RequestStatusTab } from "@/components/business/RequestStatusTab";
import { AssignedWorkersTab } from "@/components/business/AssignedWorkersTab";
import { Building, BellRing, ClipboardList, Users } from "lucide-react";

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState<string>("requests");
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Business Dashboard</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span>Worker Requests</span>
            </TabsTrigger>
            <TabsTrigger value="workers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Assigned Workers</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Worker Requests</CardTitle>
                <CardDescription>
                  View the status of your worker requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequestStatusTab />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="workers" className="mt-4">
            <AssignedWorkersTab />
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-4">
            <BusinessNotificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
