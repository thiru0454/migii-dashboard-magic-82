
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkerRequestsList } from "@/components/worker/WorkerRequestsList";
import { WorkerAssignmentTab } from "@/components/worker/WorkerAssignmentTab";
import { WorkerNotificationsTab } from "@/components/worker/WorkerNotificationsTab";
import { JobNotificationsTab } from "@/components/worker/JobNotificationsTab";
import { T } from "@/components/T";
import { Briefcase, BellRing, ClipboardList, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

export default function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState<string>("assignments");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadJobNotifications, setUnreadJobNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkerId, setCurrentWorkerId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser || !currentUser.id) {
      setIsLoading(false);
      toast.error("User not authenticated. Please log in again.");
      return;
    }
    
    // Verify worker exists in the database
    const verifyWorker = async () => {
      try {
        setIsLoading(true);
        
        // Try to find worker by phone or email
        const { data: workers, error } = await supabase
          .from('workers')
          .select('*')
          .or(`phone.eq.${currentUser.phone},email.eq.${currentUser.email}`);
          
        if (error) {
          console.error("Error verifying worker:", error);
          setIsLoading(false);
          return;
        }
        
        if (workers && workers.length > 0) {
          // Found worker in database
          const workerId = workers[0].id;
          setCurrentWorkerId(workerId);
          
          // Now fetch notification counts with the verified worker ID
          fetchUnreadCounts(workerId);
        } else {
          console.error("Worker not found in database");
          toast.error("Worker profile not found. Please contact support.");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error in verifyWorker:", error);
        setIsLoading(false);
      }
    };
    
    verifyWorker();
    
  }, []);
  
  // Check for unread notifications
  const fetchUnreadCounts = async (workerId: string) => {
    try {
      console.log("Fetching notification counts for worker ID:", workerId);
      
      // Regular notifications
      const { count: notificationsCount, error: notificationsError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', workerId)
        .eq('read', false);
        
      if (notificationsError) {
        console.error("Error fetching notifications count:", notificationsError);
      } else {
        console.log("Unread notifications count:", notificationsCount);
        setUnreadNotifications(notificationsCount || 0);
      }
      
      // Job notifications
      const { count: jobNotificationsCount, error: jobNotificationsError } = await supabase
        .from('worker_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', workerId)
        .eq('status', 'unread');
        
      if (jobNotificationsError) {
        console.error("Error fetching job notifications count:", jobNotificationsError);
      } else {
        console.log("Unread job notifications count:", jobNotificationsCount);
        setUnreadJobNotifications(jobNotificationsCount || 0);
      }
      
      // Set up real-time subscriptions for notifications
      setupNotificationSubscriptions(workerId);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching notification counts:", error);
      setIsLoading(false);
    }
  };
  
  // Set up real-time subscriptions
  const setupNotificationSubscriptions = (workerId: string) => {
    const notificationsChannel = supabase
      .channel('worker_dashboard_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${workerId}`
        },
        () => {
          console.log("Notifications changed, updating counts...");
          fetchUnreadCounts(workerId);
        }
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
          filter: `worker_id=eq.${workerId}`
        },
        () => {
          console.log("Job notifications changed, updating counts...");
          fetchUnreadCounts(workerId);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(jobNotificationsChannel);
    };
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner text="Loading your dashboard..." />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!currentWorkerId) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Worker profile not found</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't find your worker profile in our system. Please make sure you're registered or contact support.
          </p>
        </div>
      </DashboardLayout>
    );
  }
  
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
          
          <TabsContent value="assignments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Job Assignments</CardTitle>
                <CardDescription>
                  View and manage your assignments from businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkerAssignmentTab workerId={currentWorkerId} />
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
                <JobNotificationsTab workerId={currentWorkerId} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-4">
            <WorkerNotificationsTab workerId={currentWorkerId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
