import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Bell, CheckCircle, Clock, XCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface JobNotification {
  id: string;
  worker_id: string;
  job_id?: string;
  type: string;
  message: string;
  status: "read" | "unread";
  created_at: string;
  action_required?: boolean;
  action_type?: string;
}

interface JobNotificationsTabProps {
  workerId?: string | null;
}

export function JobNotificationsTab({ workerId }: JobNotificationsTabProps) {
  const [notifications, setNotifications] = useState<JobNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    // Use provided workerId or fallback to currentUser.id
    const effectiveWorkerId = workerId || currentUser?.id;
    
    if (!effectiveWorkerId) {
      setLoading(false);
      toast.error("Worker ID not found. Please log in again.");
      return;
    }

    loadNotifications(effectiveWorkerId);

    // Set up real-time subscription
    const channel = supabase
      .channel('worker_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_notifications',
          filter: `worker_id=eq.${effectiveWorkerId}`,
        },
        (payload) => {
          console.log("Notification change detected:", payload);
          loadNotifications(effectiveWorkerId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId]);

  const loadNotifications = async (workerId: string) => {
    try {
      console.log("Loading notifications for worker ID:", workerId);
      setLoading(true);
      
      // Query worker_notifications table
      const { data, error } = await supabase
        .from('worker_notifications')
        .select('*')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      console.log("Notifications loaded:", data?.length || 0, "notifications found");
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (notificationId: string, response: 'accept' | 'decline') => {
    try {
      setProcessingId(notificationId);
      
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      // Mark notification as read
      supabase
        .from('worker_notifications')
        .update({ status: 'read' })
        .eq('id', notificationId)
        .then(async ({ error: notificationError }) => {
          if (notificationError) {
            console.error("Error updating notification:", notificationError);
            toast.error("Failed to update notification");
            setProcessingId(null);
            return;
          }

          // Find the assignment in worker_assignments related to this notification
          const { data: assignments, error: assignmentError } = await supabase
            .from('worker_assignments')
            .select('*')
            .eq('job_id', notification.job_id);
            
          if (assignmentError) {
            console.error("Error finding assignment:", assignmentError);
            toast.error("Failed to find assignment");
            setProcessingId(null);
            return;
          }

          if (assignments && assignments.length > 0) {
            const assignment = assignments[0];
            
            // Update assignment status
            const { error: updateError } = await supabase
              .from('worker_assignments')
              .update({ 
                status: response === 'accept' ? 'accepted' : 'rejected',
                updated_at: new Date().toISOString()
              })
              .eq('id', assignment.id);
              
            if (updateError) {
              console.error("Error updating assignment:", updateError);
              toast.error("Failed to update assignment");
              setProcessingId(null);
              return;
            }

            // Create notification for the business
            const { error: businessNotificationError } = await supabase
              .from('business_notifications')
              .insert({
                business_id: assignment.business_id,
                type: response === 'accept' ? 'assignment_accepted' : 'assignment_rejected',
                message: `Worker ${response === 'accept' ? 'accepted' : 'rejected'} your assignment request`,
                worker_id: assignment.worker_id,
                worker_name: JSON.parse(localStorage.getItem('currentUser') || '{}')?.name || "Worker",
                read: false,
                created_at: new Date().toISOString()
              });
              
            if (businessNotificationError) {
              console.error("Error creating business notification:", businessNotificationError);
            }
          }

          // Update local state
          setNotifications(prev => 
            prev.map(n => 
              n.id === notificationId 
                ? { ...n, status: 'read' } 
                : n
            )
          );
          
          toast.success(`Job ${response === 'accept' ? 'accepted' : 'declined'} successfully`);
          setProcessingId(null);
        });
    } catch (error) {
      console.error(`Error handling notification response:`, error);
      toast.error(`Failed to ${response} job`);
      setProcessingId(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const effectiveWorkerId = workerId || JSON.parse(localStorage.getItem('currentUser') || '{}')?.id;
      if (!effectiveWorkerId) return;

      await supabase
        .from('worker_notifications')
        .update({ status: 'read' })
        .eq('worker_id', effectiveWorkerId)
        .eq('status', 'unread');

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      
      toast.success(`All notifications marked as read`);
    } catch (error) {
      console.error(`Error marking all notifications as read:`, error);
      toast.error("Failed to mark notifications as read");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner text="Loading notifications..." />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Job Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-blue-500">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">No notifications yet</p>
            <p className="text-muted-foreground">
              You don't have any job notifications yet. When you receive assignments or updates, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id} className={`${notification.status === 'unread' ? 'border-blue-500' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  {notification.type === 'job_available' ? 'New Job Available' : 
                   notification.type === 'assignment' ? 'New Assignment' : 
                   'Job Update'}
                </CardTitle>
                <Badge variant={notification.status === 'unread' ? 'default' : 'outline'}>
                  {notification.status === 'unread' ? 'New' : 'Read'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="mb-3">{notification.message}</p>
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(notification.created_at).toLocaleString()}
              </div>
              
              {notification.action_required && notification.status === 'unread' && (
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    className="border-red-500 text-red-500 hover:bg-red-50" 
                    onClick={() => handleResponse(notification.id, 'decline')}
                    disabled={processingId === notification.id}
                  >
                    {processingId === notification.id && (
                      <LoadingSpinner size="sm" className="mr-2" />
                    )}
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                  <Button 
                    className="bg-green-500 hover:bg-green-600" 
                    onClick={() => handleResponse(notification.id, 'accept')}
                    disabled={processingId === notification.id}
                  >
                    {processingId === notification.id && (
                      <LoadingSpinner size="sm" className="mr-2" />
                    )}
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
