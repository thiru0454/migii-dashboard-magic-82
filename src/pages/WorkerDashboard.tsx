import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkerRequestsList } from "@/components/worker/WorkerRequestsList";
import { WorkerAssignmentTab } from "@/components/worker/WorkerAssignmentTab";
import { WorkerNotificationsTab } from "@/components/worker/WorkerNotificationsTab";
import { JobNotificationsTab } from "@/components/worker/JobNotificationsTab";
import { T } from "@/components/T";
import { Briefcase, BellRing, ClipboardList, Bell, MapPin, Wrench, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

export default function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadJobNotifications, setUnreadJobNotifications] = useState(0);
  const [workerData, setWorkerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser || !currentUser.id) {
      return;
    }
    
    // Fetch worker data
    const fetchWorkerData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (data && !error) {
        setWorkerData(data);
      }
      setLoading(false);
    };
    
    fetchWorkerData();
    
    // Check for unread notifications
    const fetchUnreadCounts = async () => {
      // Regular notifications
      const { count: notificationsCount, error: notificationsError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);
        
      if (!notificationsError) {
        setUnreadNotifications(notificationsCount || 0);
      }
      
      // Job notifications
      const { count: jobNotificationsCount, error: jobNotificationsError } = await supabase
        .from('worker_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', currentUser.id)
        .eq('status', 'unread');
        
      if (!jobNotificationsError) {
        setUnreadJobNotifications(jobNotificationsCount || 0);
      }
    };
    
    fetchUnreadCounts();
    
    // Set up real-time subscriptions for notifications
    const notificationsChannel = supabase
      .channel('worker_dashboard_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        () => fetchUnreadCounts()
      )
      .subscribe();
      
    const jobNotificationsChannel = supabase
      .channel('worker_dashboard_job_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_notifications',
          filter: `worker_id=eq.${currentUser.id}`
        },
        () => fetchUnreadCounts()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(jobNotificationsChannel);
    };
  }, []);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Worker Dashboard</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span>Worker Requests</span>
            </TabsTrigger>
            <TabsTrigger value="jobNotifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Job Notifications</span>
              {unreadJobNotifications > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                  {unreadJobNotifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <span>Notifications</span>
              {unreadNotifications > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Worker Profile</CardTitle>
                <CardDescription>
                  View your personal and employment information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center">Loading profile information...</div>
                ) : workerData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <span className="font-medium w-32">Name:</span>
                            <span>{workerData.name || workerData["Full Name"] || "Not specified"}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium w-32">Phone:</span>
                            <span>{workerData.phone || workerData["Phone Number"] || "Not specified"}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium w-32">Email:</span>
                            <span>{workerData.email || workerData["Email Address"] || "Not specified"}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium w-32">Age:</span>
                            <span>{workerData.age || workerData["Age"] || "Not specified"}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium w-28">Origin State:</span>
                            <span>{workerData.originState || workerData["Origin State"] || workerData.origin_state || "Not specified"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Work Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Wrench className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium w-28">Skill:</span>
                            <span>{workerData.skill || workerData["Primary Skill"] || workerData.primary_skill || "Not specified"}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium w-32">Status:</span>
                            <Badge variant={workerData.status === "active" ? "success" : "secondary"}>
                              {workerData.status || "Not specified"}
                            </Badge>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium w-32">Aadhaar:</span>
                            <span>{workerData.aadhaar || workerData["Aadhaar Number"] || "Not specified"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-red-500">
                    Could not load worker profile. Please try logging in again.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
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
          
          <TabsContent value="jobNotifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Job Notifications</CardTitle>
                <CardDescription>
                  New job assignments and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JobNotificationsTab />
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
