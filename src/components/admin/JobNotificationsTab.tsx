import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface JobNotification {
  id: string;
  type: string;
  job_id: string;
  business_id: string;
  business_name: string;
  message: string;
  status: string;
  created_at: string;
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
      const { data, error } = await supabase
        .from('admin_notifications')
        .select(`
          *,
          job:job_id (*)
        `)
        .eq('type', 'new_job')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch notifications: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobApproval = async (jobId: string, status: 'approved' | 'rejected') => {
    try {
      // Update job status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Update notification status
      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .update({ status: 'read' })
        .eq('job_id', jobId);

      if (notificationError) throw notificationError;

      // If approved, notify workers
      if (status === 'approved') {
        const { data: job } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (job) {
          // Get workers with matching skills
          const { data: workers } = await supabase
            .from('workers')
            .select('id, name, email')
            .eq('skill', job.category)
            .eq('status', 'available');

          if (workers && workers.length > 0) {
            // Create notifications for workers
            const workerNotifications = workers.map(worker => ({
              worker_id: worker.id,
              job_id: jobId,
              type: 'job_available',
              status: 'unread',
              created_at: new Date().toISOString(),
              title: `New ${job.category} job available`,
              message: `${job.company} is looking for ${job.workers_needed} ${job.category} workers`,
              action_required: true,
              action_type: 'accept_decline'
            }));

            const { error: workerNotificationError } = await supabase
              .from('worker_notifications')
              .insert(workerNotifications);

            if (workerNotificationError) {
              console.error("Error creating worker notifications:", workerNotificationError);
            }
          }
        }
      }

      toast.success(`Job ${status} successfully`);
      fetchNotifications();
    } catch (error: any) {
      toast.error("Failed to update job status: " + error.message);
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
                          {notification.job?.title || 'Job Notification'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          From: {notification.business_name}
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
                          <p><strong>Workers Needed:</strong> {notification.job.workers_needed}</p>
                          <p><strong>Duration:</strong> {notification.job.duration}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>

                    {notification.status === 'unread' && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJobApproval(notification.job_id, 'approved')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJobApproval(notification.job_id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
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