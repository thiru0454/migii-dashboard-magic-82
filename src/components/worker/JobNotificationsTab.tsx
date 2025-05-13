
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, BellRing } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getWorkerNotifications, updateNotificationStatus } from "@/utils/supabaseClient";
import { Badge } from "@/components/ui/badge";

export function JobNotificationsTab() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getWorkerNotifications(currentUser?.id || '');
      if (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
      } else {
        console.log("Fetched notifications:", data);
        setNotifications(data || []);
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
      
      // Also update the assignment status in worker_assignments table
      // This would be handled by the updateNotificationStatus function
      
    } catch (err) {
      console.error(`Error in handle${status}:`, err);
      toast.error(`Failed to ${status} job`);
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
                <p className="mb-4">{notification.message}</p>
                {notification.action_required && notification.action_type === 'accept_decline' && (
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAcceptDecline(notification.id, 'declined')}
                      className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleAcceptDecline(notification.id, 'accepted')}
                      className="bg-primary text-primary-foreground"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
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
