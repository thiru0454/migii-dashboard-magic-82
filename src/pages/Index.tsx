import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkersTable } from "@/components/admin/WorkersTable";
import { HelpRequestsList } from "@/components/admin/HelpRequestsList";
import { mockWorkers, mockHelpRequests, dashboardStats } from "@/data/mockData";
import {
  UserPlus,
  Users,
  Clock,
  MessageSquare,
  Activity,
  BarChart3,
  Map,
  ChevronRight,
} from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to migii Worker Management System
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <a href="/worker-registration">
                <UserPlus className="mr-2 h-4 w-4" />
                New Registration
              </a>
            </Button>
            <Button asChild>
              <a href="/admin-dashboard">
                <Users className="mr-2 h-4 w-4" />
                Worker Database
              </a>
            </Button>
          </div>
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
                <div className="text-2xl font-bold">{dashboardStats.totalWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  +{dashboardStats.recentRegistrations} new this month
                </p>
              </DashboardCard>
              
              <DashboardCard
                title="Active Workers"
                icon={<Activity size={16} />}
              >
                <div className="text-2xl font-bold">{dashboardStats.activeWorkers}</div>
                <Progress 
                  value={(dashboardStats.activeWorkers / dashboardStats.totalWorkers) * 100} 
                  className="h-2 mt-2"
                />
              </DashboardCard>
              
              <DashboardCard
                title="Pending Registrations"
                icon={<Clock size={16} />}
              >
                <div className="text-2xl font-bold">{dashboardStats.pendingRegistrations}</div>
                <p className="text-xs text-muted-foreground">
                  Requires verification
                </p>
              </DashboardCard>
              
              <DashboardCard
                title="Help Requests"
                icon={<MessageSquare size={16} />}
              >
                <div className="text-2xl font-bold">{dashboardStats.helpRequests}</div>
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
                  {dashboardStats.popularSkills.map((item) => (
                    <div key={item.skill} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{item.skill}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(item.count / dashboardStats.totalWorkers) * 100} 
                          className="h-2 w-24"
                        />
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>
              
              <DashboardCard
                title="State Distribution"
                icon={<Map size={16} />}
              >
                <div className="space-y-4">
                  {dashboardStats.stateDistribution.map((item) => (
                    <div key={item.state} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{item.state}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(item.count / dashboardStats.totalWorkers) * 100} 
                          className="h-2 w-24"
                        />
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            </div>
            
            <div className="grid gap-4 grid-cols-1">
              <DashboardCard
                title="Recent Workers"
                icon={<UserPlus size={16} />}
              >
                <div className="space-y-2">
                  {mockWorkers.slice(0, 5).map((worker) => (
                    <div key={worker.id} className="flex items-center justify-between border-b pb-2">
                      <div className="space-y-1">
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-xs text-muted-foreground">{worker.skill}</p>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`/worker/${worker.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/admin-dashboard">View All Workers</a>
                  </Button>
                </div>
              </DashboardCard>
            </div>
          </TabsContent>
          
          <TabsContent value="workers" className="space-y-4">
            <WorkersTable workers={mockWorkers} />
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
