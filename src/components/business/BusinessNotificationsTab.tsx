
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Bell, Check, UserCheck, User } from "lucide-react";
import { toast } from "sonner";

interface BusinessNotification {
  id: string;
  business_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  worker_id?: string;
  worker_name?: string;
}

export function BusinessNotificationsTab() {
  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('business_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_notifications',
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const businessData = JSON.parse(localStorage.getItem('currentBusiness') || '{}');
      const businessId = businessData.id;
      
      if (!businessId) {
        console.warn("No business ID found in local storage");
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from("business_notifications")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
        
      if (error) {
        throw error;
      }
      
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
        .from("business_notifications")
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
      toast.error("Failed to update notification status");
    }
  };

  const markAllAsRead = async () => {
    try {
      const businessData = JSON.parse(localStorage.getItem('currentBusiness') || '{}');
      const businessId = businessData.id;
      
      if (!businessId) {
        console.warn("No business ID found in local storage");
        return;
      }
      
      const { error } = await supabase
        .from("business_notifications")
        .update({ read: true })
        .eq("business_id", businessId)
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
      case 'worker_assigned':
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case 'worker_accepted':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'worker_declined':
        return <User className="h-5 w-5 text-red-500" />;
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
                  {notification.worker_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Worker: {notification.worker_name}
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
