import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { WorkerRequestsList } from "@/components/admin/WorkerRequestsList";
import { AssignWorkersTab } from "@/components/admin/AssignWorkersTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkersTab } from "@/components/admin/WorkersTab";
import { useWorkersContext } from "@/contexts/WorkersContext";

export default function AdminDashboard() {
  const { workers } = useWorkersContext();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <Tabs defaultValue="workers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="requests">Worker Requests</TabsTrigger>
            <TabsTrigger value="assign">Assign Workers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="workers">
            <DashboardCard title="Registered Workers">
              <WorkersTab />
            </DashboardCard>
          </TabsContent>
          
          <TabsContent value="requests">
            <DashboardCard title="Worker Requests">
              <WorkerRequestsList />
            </DashboardCard>
          </TabsContent>
          
          <TabsContent value="assign">
            <DashboardCard title="Assign Workers">
              <AssignWorkersTab />
            </DashboardCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 