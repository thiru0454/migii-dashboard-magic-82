
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Bell, Briefcase, Building } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

interface WorkerNotificationsTabProps {
  workerId?: string | null;
}

export function WorkerNotificationsTab({ workerId }: WorkerNotificationsTabProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const effectiveWorkerId = workerId || JSON.parse(localStorage.getItem('currentUser') || '{}')?.id;
    
    if (!effectiveWorkerId) {
      setLoading(false);
      console.warn("No worker ID found");
      return;
    }
    
    loadNotifications(effectiveWorkerId);
    
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${effectiveWorkerId}`,
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

  const loadNotifications = async (userId: string) => {
    try {
      console.log("Loading notifications for user ID:", userId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
        
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

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      const effectiveWorkerId = workerId || JSON.parse(localStorage.getItem('currentUser') || '{}')?.id;
      
      if (!effectiveWorkerId) return;
      
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", effectiveWorkerId)
        .eq("read", false);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Building className="h-5 w-5 text-blue-500" />;
      case 'job_assignment':
        return <Briefcase className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <LoadingSpinner text="Loading notifications..." />
        </CardContent>
      </Card>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Notifications
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                  notification.read ? 'bg-background' : 'bg-muted/30'
                }`}
              >
                <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <p className="text-sm">{notification.message}</p>
                  {notification.metadata && notification.metadata.deadline && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Deadline: {notification.metadata.deadline}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                    className="text-xs"
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
