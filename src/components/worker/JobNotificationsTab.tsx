
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, BellRing, AlertCircle, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getWorkerNotifications, updateNotificationStatus, markNotificationAsRead, supabase } from "@/utils/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface WorkerNotification {
  id: string;
  worker_id: string;
  job_id?: string;
  type: string;
  message: string;
  status: 'unread' | 'read' | 'accepted' | 'declined';
  created_at: string;
  updated_at?: string;
  action_required: boolean;
  action_type?: string;
  title?: string;
}

export function JobNotificationsTab() {
  const [notifications, setNotifications] = useState<WorkerNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('worker_job_notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'worker_notifications'
          },
          (payload) => {
            console.log('Worker notification changed:', payload);
            fetchNotifications();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching notifications for worker ID:", currentUser?.id);
      const { data, error } = await getWorkerNotifications(currentUser?.id || '');
      if (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } else {
        console.log("Fetched worker notifications:", data);
        setNotifications(data || []);
        
        // Mark unread notifications as read when viewed
        const unreadNotifications = data?.filter(n => n.status === 'unread') || [];
        for (const notification of unreadNotifications) {
          if (notification.id) {
            await markNotificationAsRead(notification.id);
          }
        }
      }
    } catch (err) {
      console.error("Error in fetchNotifications:", err);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (notificationId: string, status: 'accepted' | 'declined') => {
    setProcessingId(notificationId);
    try {
      const { error } = await updateNotificationStatus(notificationId, status);
      if (error) {
        console.error(`Error ${status} notification:`, error);
        toast.error(`Failed to ${status} job`);
        return;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status, action_required: false } 
            : notification
        )
      );
      
      toast.success(`Job ${status} successfully`);
    } catch (err) {
      console.error(`Error in handle${status}:`, err);
      toast.error(`Failed to ${status} job`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'unread':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">New</Badge>;
      case 'read':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Read</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return date;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading notifications..." />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <BellRing className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            You don't have any job notifications yet.
            <br />When you're assigned to jobs, they will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Job Notifications</h3>
        <Button variant="outline" size="sm" onClick={fetchNotifications}>
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">
                    {notification.title || "Job Assignment"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {formatTimeAgo(notification.created_at)}
                  </CardDescription>
                </div>
                {getStatusBadge(notification.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{notification.message}</p>
              
              {notification.action_required && notification.action_type === 'accept_decline' && (
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => handleResponse(notification.id, 'declined')}
                    disabled={processingId === notification.id}
                  >
                    {processingId === notification.id ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Decline
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleResponse(notification.id, 'accepted')}
                    disabled={processingId === notification.id}
                  >
                    {processingId === notification.id ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Accept
                  </Button>
                </div>
              )}
              
              {!notification.action_required && ['accepted', 'declined'].includes(notification.status) && (
                <div className="flex justify-end">
                  <Badge className={notification.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    You {notification.status} this job
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
