import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Building, Users, ClipboardList, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkersTable } from "@/components/admin/WorkersTable";
import { useWorkers } from "@/hooks/useWorkers";
import { AssignWorkersTab } from "@/components/business/AssignWorkersTab";
import { ProjectsTab } from "@/components/business/ProjectsTab";
import { MigrantWorker } from "@/types/worker";

const BusinessDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { workers } = useWorkers();
  const [assignedWorkers, setAssignedWorkers] = useState<MigrantWorker[]>([]);

  useEffect(() => {
    // Simulate assigned workers based on business ID
    // In a real app, this would come from a database
    if (currentUser) {
      const businessId = currentUser.businessId;
      // Filter workers randomly to simulate assignments
      // Cast workers to MigrantWorker[] to fix TypeScript error
      const typedWorkers = workers as MigrantWorker[];
      const assigned = typedWorkers.filter((worker, index) => {
        // Use a deterministic approach based on worker id and business id
        return (index % 3 === 0); // Just for demo, assign roughly 1/3 of workers
      });
      setAssignedWorkers(assigned);
    }
  }, [workers, currentUser]);

  const handleLogout = () => {
    // Assuming logout function is available in useAuth
    // logout();
    navigate("/login");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {currentUser?.name || currentUser?.businessId || "Unknown"}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="assign">Assign Workers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Workers
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignedWorkers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently assigned to your business
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Projects
                  </CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +2 new this month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Project Completion
                  </CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-xs text-muted-foreground">
                    +12% improvement
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Business Rating
                  </CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs text-muted-foreground">
                    Based on worker feedback
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Business ID:</strong> {currentUser?.businessId}</p>
                  <p><strong>Name:</strong> {currentUser?.name}</p>
                  <p><strong>Email:</strong> {currentUser?.email}</p>
                  <p><strong>Phone:</strong> {currentUser?.phone}</p>
                  <p><strong>Registration Date:</strong> {currentUser?.registrationDate ? new Date(currentUser?.registrationDate).toLocaleDateString() : "Not available"}</p>
                  <p><strong>Workers Assigned:</strong> {assignedWorkers.length}</p>
                  <p><strong>Current Status:</strong> {currentUser?.status || "Active"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workers">
            <WorkersTable 
              workers={assignedWorkers} 
              onViewDetails={() => {}}
            />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab businessId={currentUser?.businessId} />
          </TabsContent>

          <TabsContent value="assign">
            <AssignWorkersTab 
              businessId={currentUser?.businessId} 
              currentWorkers={assignedWorkers} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default BusinessDashboard;
