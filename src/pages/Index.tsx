import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkersTable } from "@/components/admin/WorkersTable";
import { HelpRequestsList } from "@/components/admin/HelpRequestsList";
import { mockHelpRequests, dashboardStats } from "@/data/mockData";
import { useWorkers } from "@/hooks/useWorkers";
import { MigrantWorker } from "@/types/worker";
import {
  UserPlus,
  Users,
  Clock,
  MessageSquare,
  Activity,
  BarChart3,
  Map,
  ChevronRight,
  Building,
  LogIn,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { workers, isLoadingWorkers } = useWorkers();
  const navigate = useNavigate();
  
  const typedWorkers = workers as MigrantWorker[];
  
  const activeWorkers = typedWorkers.filter(w => w.status === "active").length;
  const pendingRegistrations = typedWorkers.filter(w => w.status === "pending").length;
  
  const skillCounts: Record<string, number> = {};
  typedWorkers.forEach(worker => {
    if (worker.skill) {
      skillCounts[worker.skill] = (skillCounts[worker.skill] || 0) + 1;
    }
  });
  
  const popularSkills = Object.entries(skillCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const stateCounts: Record<string, number> = {};
  typedWorkers.forEach(worker => {
    if (worker.originState) {
      stateCounts[worker.originState] = (stateCounts[worker.originState] || 0) + 1;
    }
  });
  
  const stateDistribution = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const handleViewDetails = (worker: MigrantWorker) => {
    console.log("View details for worker:", worker.id);
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">MIGII</h1>
            <p className="text-muted-foreground">
              Welcome to Migii Worker Management System
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <a href="/worker-registration">
                <UserPlus className="mr-2 h-4 w-4" />
                Register Worker
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/admin-dashboard">
                <Users className="mr-2 h-4 w-4" />
                Admin Portal
              </a>
            </Button>
            <Button asChild>
              <a href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/login?tab=admin')}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Admin Portal</h3>
              <p className="text-sm text-muted-foreground">Manage workers, businesses and support requests</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/login?tab=business')}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Business Portal</h3>
              <p className="text-sm text-muted-foreground">Manage your workforce and projects</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/worker-login')}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Worker Portal</h3>
              <p className="text-sm text-muted-foreground">Access your details and submit support requests</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="help-requests">Help Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <DashboardCard
                title="Total Workers"
                icon={<Users size={16} />}
              >
                <div className="text-2xl font-bold">{typedWorkers.length}</div>
                <p className="text-xs text-muted-foreground">
                  +{dashboardStats.recentRegistrations} new this month
                </p>
              </DashboardCard>
              
              <DashboardCard
                title="Active Workers"
                icon={<Activity size={16} />}
              >
                <div className="text-2xl font-bold">{activeWorkers}</div>
                <Progress 
                  value={(activeWorkers / (typedWorkers.length || 1)) * 100} 
                  className="h-2 mt-2"
                />
              </DashboardCard>
              
              <DashboardCard
                title="Pending Registrations"
                icon={<Clock size={16} />}
              >
                <div className="text-2xl font-bold">{pendingRegistrations}</div>
                <p className="text-xs text-muted-foreground">
                  Requires verification
                </p>
              </DashboardCard>
              
              <DashboardCard
                title="Help Requests"
                icon={<MessageSquare size={16} />}
              >
                <div className="text-2xl font-bold">{mockHelpRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  {mockHelpRequests.filter(req => req.status === "pending").length} pending requests
                </p>
              </DashboardCard>
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <DashboardCard
                title="Popular Skills"
                icon={<BarChart3 size={16} />}
              >
                <div className="space-y-4">
                  {popularSkills.length > 0 ? (
                    popularSkills.map((item) => (
                      <div key={item.skill} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.skill}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(item.count / (typedWorkers.length || 1)) * 100} 
                            className="h-2 w-24"
                          />
                          <span className="text-sm text-muted-foreground">{item.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No worker data available
                    </div>
                  )}
                </div>
              </DashboardCard>
              
              <DashboardCard
                title="State Distribution"
                icon={<Map size={16} />}
              >
                <div className="space-y-4">
                  {stateDistribution.length > 0 ? (
                    stateDistribution.map((item) => (
                      <div key={item.state} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.state}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(item.count / (typedWorkers.length || 1)) * 100} 
                            className="h-2 w-24"
                          />
                          <span className="text-sm text-muted-foreground">{item.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No worker data available
                    </div>
                  )}
                </div>
              </DashboardCard>
            </div>
          </TabsContent>
          
          <TabsContent value="workers" className="space-y-4">
            <WorkersTable 
              workers={typedWorkers} 
              isLoading={isLoadingWorkers} 
              onViewDetails={handleViewDetails}
            />
          </TabsContent>
          
          <TabsContent value="help-requests" className="space-y-4">
            <HelpRequestsList requests={mockHelpRequests} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
