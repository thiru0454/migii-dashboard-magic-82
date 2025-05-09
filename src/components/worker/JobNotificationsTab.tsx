import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, XCircle } from "lucide-react";

interface JobNotification {
  id: string;
  worker_id: string;
  job_id: string;
  type: string;
  status: string;
  created_at: string;
  title: string;
  message: string;
  action_required: boolean;
  action_type: string;
  job?: any;
}

export function JobNotificationsTab() {
  const [notifications, setNotifications] = useState<JobNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from('worker_notifications')
        .select(`
          *,
          job:job_id (*)
        `)
        .eq('worker_id', user.id)
        .eq('type', 'job_available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch notifications: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobResponse = async (jobId: string, response: 'accepted' | 'declined') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Update notification status
      const { error: notificationError } = await supabase
        .from('worker_notifications')
        .update({ status: 'read' })
        .eq('job_id', jobId)
        .eq('worker_id', user.id);

      if (notificationError) throw notificationError;

      if (response === 'accepted') {
        // Check if job is still available
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (jobError) throw jobError;

        if (job.status !== 'approved') {
          toast.error("This job is no longer available");
          return;
        }

        // Create job application
        const { error: applicationError } = await supabase
          .from('job_applications')
          .insert({
            job_id: jobId,
            worker_id: user.id,
            status: 'pending',
            created_at: new Date().toISOString()
          });

        if (applicationError) throw applicationError;

        // Update worker status to 'busy'
        const { error: workerError } = await supabase
          .from('workers')
          .update({ status: 'busy' })
          .eq('id', user.id);

        if (workerError) throw workerError;

        // Notify business
        const { error: businessNotificationError } = await supabase
          .from('business_notifications')
          .insert({
            business_id: job.business_id,
            type: 'job_application',
            status: 'unread',
            created_at: new Date().toISOString(),
            title: 'New Job Application',
            message: `A worker has applied for your ${job.title} position`,
            job_id: jobId
          });

        if (businessNotificationError) {
          console.error("Error creating business notification:", businessNotificationError);
        }
      }

      toast.success(`Job ${response} successfully`);
      fetchNotifications();
    } catch (error: any) {
      toast.error("Failed to process job response: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No new job notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      <Badge variant={notification.status === 'unread' ? 'default' : 'secondary'}>
                        {notification.status}
                      </Badge>
                    </div>

                    {notification.job && (
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Location:</strong> {notification.job.location}</p>
                          <p><strong>Type:</strong> {notification.job.type}</p>
                          <p><strong>Category:</strong> {notification.job.category}</p>
                        </div>
                        <div>
                          <p><strong>Salary:</strong> {notification.job.salary}</p>
                          <p><strong>Duration:</strong> {notification.job.duration}</p>
                          <p><strong>Start Date:</strong> {new Date(notification.job.start_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}

                    {notification.status === 'unread' && notification.action_required && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJobResponse(notification.job_id, 'accepted')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJobResponse(notification.job_id, 'declined')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 