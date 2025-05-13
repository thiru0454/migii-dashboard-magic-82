
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface BusinessNotification {
  id: string;
  business_id: string;
  type: string;
  message: string;
  worker_id?: string;
  worker_name?: string;
  created_at: string;
  read: boolean;
}

export function BusinessNotificationsTab() {
  const [notifications, setNotifications] = useState<BusinessNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('business_notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'business_notifications',
            filter: `business_id=eq.${currentUser.id}`
          },
          () => {
            console.log('Business notification changed, refreshing...');
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
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_notifications')
        .select('*')
        .eq('business_id', currentUser?.id || '')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setNotifications(data || []);
      
      // Mark all fetched notifications as read
      const unreadIds = data?.filter(n => !n.read).map(n => n.id) || [];
      if (unreadIds.length > 0) {
        await supabase
          .from('business_notifications')
          .update({ read: true })
          .in('id', unreadIds);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'worker_assigned':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'worker_accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'worker_declined':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Notifications</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 mb-2 opacity-40" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="flex items-start p-3 rounded-md border border-border bg-card"
              >
                <div className="mr-3 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="font-medium">{notification.worker_name || 'System'}</div>
                    <Badge variant={
                      notification.type === 'worker_accepted' ? 'success' : 
                      notification.type === 'worker_declined' ? 'destructive' : 
                      notification.type === 'worker_assigned' ? 'default' : 
                      'outline'
                    }>
                      {notification.type.replace('worker_', '').replace(/^\w/, c => c.toUpperCase())}
                    </Badge>
                  </div>
                  <p className="text-sm my-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
