
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Bell, CheckCircle, X, Info, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BusinessNotification {
  id: string;
  business_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  worker_id?: string;
  worker_name?: string;
  job_id?: string;
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
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      // First get the business ID
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('email', currentUser.email)
        .single();
        
      if (businessError) {
        console.error("Error fetching business ID:", businessError);
        setLoading(false);
        return;
      }
      
      const businessId = businessData.id;
      console.log("Fetching notifications for business ID:", businessId);
      
      const { data, error } = await supabase
        .from("business_notifications")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });
        
      if (error) {
        throw error;
      }
      
      console.log("Business notifications loaded:", data);
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading business notifications:", error);
      setNotifications([]);
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
    }
  };

  const markAllAsRead = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      // First get the business ID
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('email', currentUser.email)
        .single();
        
      if (businessError) {
        throw businessError;
      }
      
      const businessId = businessData.id;
      
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
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('accepted')) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (type.includes('declined') || type.includes('rejected')) {
      return <X className="h-5 w-5 text-red-500" />;
    } else if (type.includes('worker')) {
      return <Briefcase className="h-5 w-5 text-blue-500" />;
    } else {
      return <Info className="h-5 w-5 text-gray-500" />;
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
          Business Notifications
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
                className={`p-4 rounded-lg border flex items-start gap-3 transition-colors ${
                  notification.read ? 'bg-background' : 'bg-muted/30'
                }`}
              >
                <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  {notification.worker_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Worker: {notification.worker_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
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
