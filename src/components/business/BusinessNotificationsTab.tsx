
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getBusinessNotifications, markBusinessNotificationAsRead, markAllBusinessNotificationsAsRead } from "@/utils/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function BusinessNotificationsTab() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.businessId) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getBusinessNotifications(currentUser?.businessId || '');
      if (error) {
        console.error("Error fetching business notifications:", error);
        toast.error("Failed to load notifications");
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Error in fetchNotifications:", err);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await markBusinessNotificationAsRead(notificationId);
      if (error) {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to mark notification as read");
      } else {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (err) {
      console.error("Error in markAsRead:", err);
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await markAllBusinessNotificationsAsRead(currentUser?.businessId || '');
      if (error) {
        console.error("Error marking all notifications as read:", error);
        toast.error("Failed to mark all notifications as read");
      } else {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        toast.success("Marked all notifications as read");
      }
    } catch (err) {
      console.error("Error in markAllAsRead:", err);
      toast.error("Failed to mark all notifications as read");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper function to get notification status color
  const getStatusColor = (type) => {
    if (type === 'worker_accepted') return 'bg-green-100 text-green-800';
    if (type === 'worker_declined') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Business Notifications</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
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
            <Card 
              key={notification.id} 
              className={`overflow-hidden border-l-4 ${
                notification.read ? 'border-l-gray-200' : 'border-l-primary'
              }`}
            >
              <CardHeader className="py-3 px-4 bg-muted/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {notification.type === 'worker_assigned' && 'New Worker Assignment'}
                  {notification.type === 'worker_accepted' && 'Worker Accepted Job'}
                  {notification.type === 'worker_declined' && 'Worker Declined Job'}
                  {!['worker_assigned', 'worker_accepted', 'worker_declined'].includes(notification.type) && 
                    'Notification'}
                </CardTitle>
                <Badge 
                  className={`${getStatusColor(notification.type)}`}
                  variant="outline"
                >
                  {notification.type === 'worker_assigned' && 'New'}
                  {notification.type === 'worker_accepted' && 'Accepted'}
                  {notification.type === 'worker_declined' && 'Declined'}
                  {!['worker_assigned', 'worker_accepted', 'worker_declined'].includes(notification.type) && 
                    'Info'}
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-sm">{notification.message}</p>
                  {notification.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                
                {notification.worker_name && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Worker: {notification.worker_name}
                  </div>
                )}
                
                {!notification.read && (
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
