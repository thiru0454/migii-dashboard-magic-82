
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, BellRing, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getWorkerNotifications, updateNotificationStatus, markNotificationAsRead } from "@/utils/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export function JobNotificationsTab() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
            table: 'worker_notifications',
            filter: `worker_id=eq.${currentUser.id}`
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

  const handleAcceptDecline = async (notificationId: string, status: 'accepted' | 'declined') => {
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
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
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

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <BellRing className="mx-auto h-10 w-10 mb-3 text-muted-foreground/70" />
            <p>No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className="overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">{notification.title || "Job Assignment"}</CardTitle>
                <Badge variant={notification.status === 'unread' ? "outline" : 
                       notification.status === 'accepted' ? "success" : 
                       notification.status === 'declined' ? "destructive" : "secondary"}>
                  {notification.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <p>{notification.message}</p>
                  {notification.created_at && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </p>
                  )}
                  
                  {notification.action_required && notification.status !== 'accepted' && notification.status !== 'declined' && (
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        onClick={() => handleAcceptDecline(notification.id, 'accepted')}
                        className="bg-green-500 hover:bg-green-600 text-white flex items-center"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleAcceptDecline(notification.id, 'declined')}
                        className="flex items-center"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  )}
                  
                  {(notification.status === 'accepted' || notification.status === 'declined') && (
                    <div className="text-sm mt-2">
                      <span className="font-medium">Status:</span>{' '}
                      <span className={notification.status === 'accepted' ? 'text-green-600' : 'text-red-600'}>
                        You {notification.status} this assignment
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
