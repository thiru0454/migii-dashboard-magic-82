
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { WorkerRequestsList } from "@/components/admin/WorkerRequestsList";
import { AssignWorkersTab } from "@/components/admin/AssignWorkersTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkersTab } from "@/components/admin/WorkersTab";
import { useWorkersContext } from "@/contexts/WorkersContext";
import { ProjectsTab } from "@/components/admin/ProjectsTab";
import { RequestWorkersTab } from "@/components/admin/RequestWorkersTab";
import { RequestStatusTab } from "@/components/admin/RequestStatusTab";

export default function AdminDashboard() {
  const { workers } = useWorkersContext();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="assign">Assign Workers</TabsTrigger>
            <TabsTrigger value="request-workers">Request Workers</TabsTrigger>
            <TabsTrigger value="request-status">Request Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <DashboardCard title="Overview">
              {/* Overview content will be implemented later */}
              <div className="p-4">
                <p>Welcome to the admin dashboard overview.</p>
              </div>
            </DashboardCard>
          </TabsContent>
          
          <TabsContent value="workers">
            <DashboardCard title="Registered Workers">
              <WorkersTab />
            </DashboardCard>
          </TabsContent>
          
          <TabsContent value="projects">
            <DashboardCard title="Projects">
              <ProjectsTab />
            </DashboardCard>
          </TabsContent>
          
          <TabsContent value="assign">
            <DashboardCard title="Assign Workers">
              <AssignWorkersTab />
            </DashboardCard>
          </TabsContent>
          
          <TabsContent value="request-workers">
            <DashboardCard title="Request Workers">
              <RequestWorkersTab />
            </DashboardCard>
          </TabsContent>
          
          <TabsContent value="request-status">
            <DashboardCard title="Request Status">
              <RequestStatusTab />
            </DashboardCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
