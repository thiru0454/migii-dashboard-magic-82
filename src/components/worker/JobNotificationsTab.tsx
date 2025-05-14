
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, Clock, Briefcase } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface WorkerNotification {
  id: string;
  worker_id: string;
  job_id?: string;
  business_id?: string;
  type: string;
  title?: string;
  message: string;
  status: "read" | "unread" | "accepted" | "declined";
  created_at: string;
  action_required: boolean;
  action_type?: string;
}

export function JobNotificationsTab() {
  const [notifications, setNotifications] = useState<WorkerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('worker_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_notifications',
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
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      if (!currentUser || !currentUser.id) {
        console.warn("No user ID found in localStorage");
        setNotifications([]);
        return;
      }
      
      // Fetch notifications from worker_notifications table
      const { data, error } = await supabase
        .from('worker_notifications')
        .select('*')
        .eq('worker_id', currentUser.id)
        .order('created_at', { ascending: false });
        
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
  
  const handleNotificationAction = async (notificationId: string, action: 'accept' | 'decline' | 'read') => {
    try {
      setActionInProgress(notificationId);
      
      // Get the notification details first
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;
      
      let newStatus: 'read' | 'accepted' | 'declined' = 'read';
      
      if (action === 'accept') {
        newStatus = 'accepted';
      } else if (action === 'decline') {
        newStatus = 'declined';
      }
      
      // Update the notification status in Supabase
      const { error } = await supabase
        .from('worker_notifications')
        .update({ 
          status: newStatus,
          action_required: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);
        
      if (error) throw error;
      
      // If assignment was accepted, create a record in worker_assignments if it doesn't exist
      if (action === 'accept' && notification.type === 'assignment' && notification.business_id) {
        // Get the current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Check if assignment already exists
        const { data: existingAssignments } = await supabase
          .from('worker_assignments')
          .select('*')
          .eq('worker_id', currentUser.id)
          .eq('business_id', notification.business_id);
          
        // Only create if it doesn't exist
        if (!existingAssignments || existingAssignments.length === 0) {
          await supabase.from('worker_assignments').insert({
            worker_id: currentUser.id,
            business_id: notification.business_id,
            business_name: notification.title?.replace('New Assignment: ', '') || 'Business',
            status: 'accepted',
            job_description: notification.message,
            created_at: new Date().toISOString()
          });
        }
        
        // Also update any related worker request
        if (notification.job_id) {
          await supabase
            .from('worker_requests')
            .update({ status: 'accepted' })
            .eq('id', notification.job_id);
        }
        
        // Create notification for the business
        await supabase.from('business_notifications').insert({
          business_id: notification.business_id,
          type: 'worker_accepted',
          message: `Worker has accepted your assignment request`,
          worker_id: currentUser.id,
          worker_name: currentUser.name || 'Worker',
          read: false,
          created_at: new Date().toISOString()
        });
        
        // Update worker status to "assigned" in workers table
        await supabase
          .from('workers')
          .update({ status: 'assigned', assignedBusinessId: notification.business_id })
          .eq('id', currentUser.id);
          
        toast.success("Assignment accepted successfully");
        
        // Navigate to assignments tab to show the new assignment
        setTimeout(() => {
          navigate('/worker-dashboard', { state: { activeTab: 'assignments' } });
        }, 1000);
      } else if (action === 'decline' && notification.type === 'assignment' && notification.business_id) {
        // Get the current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Update any related worker request
        if (notification.job_id) {
          await supabase
            .from('worker_requests')
            .update({ 
              status: 'declined',
              assigned_worker_id: null,
              assigned_worker_name: null
            })
            .eq('id', notification.job_id);
        }
        
        // Create notification for the business
        await supabase.from('business_notifications').insert({
          business_id: notification.business_id,
          type: 'worker_declined',
          message: `Worker has declined your assignment request`,
          worker_id: currentUser.id,
          worker_name: currentUser.name || 'Worker',
          read: false,
          created_at: new Date().toISOString()
        });
        
        // Update worker status to "available" in workers table
        await supabase
          .from('workers')
          .update({ status: 'available', assignedBusinessId: null })
          .eq('id', currentUser.id);
          
        toast.success("Assignment declined successfully");
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, status: newStatus, action_required: false } : n)
      );
      
    } catch (error) {
      console.error(`Error handling notification action (${action}):`, error);
      toast.error(`Failed to ${action} notification`);
    } finally {
      setActionInProgress(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'unread':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'read':
        return <Badge variant="outline">Read</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-red-500">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'assignment':
        return <Briefcase className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner text="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">No notifications</p>
            <p className="text-muted-foreground">
              You don't have any job notifications yet. When businesses assign you to jobs, you'll receive notifications here.
            </p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id} className={`transition-shadow hover:shadow-md ${notification.status === 'unread' ? 'border-l-4 border-l-primary' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getTypeIcon(notification.type)}
                  <div>
                    <CardTitle className="text-base font-medium">
                      {notification.title || (notification.type === 'assignment' ? 'New Job Assignment' : 'Notification')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(notification.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{notification.message}</p>
              
              {notification.action_required && notification.status === 'unread' && (
                <div className="flex gap-2 justify-end">
                  {notification.action_type === 'accept_decline' && (
                    <>
                      <Button 
                        variant="outline" 
                        className="text-red-500 border-red-500 hover:bg-red-50 flex gap-1"
                        onClick={() => handleNotificationAction(notification.id, 'decline')}
                        disabled={actionInProgress === notification.id}
                      >
                        {actionInProgress === notification.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Decline
                      </Button>
                      <Button 
                        className="bg-green-500 hover:bg-green-600 flex gap-1"
                        onClick={() => handleNotificationAction(notification.id, 'accept')}
                        disabled={actionInProgress === notification.id}
                      >
                        {actionInProgress === notification.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Accept
                      </Button>
                    </>
                  )}
                  {notification.action_type !== 'accept_decline' && (
                    <Button 
                      onClick={() => handleNotificationAction(notification.id, 'read')}
                      disabled={actionInProgress === notification.id}
                      className="flex gap-1"
                    >
                      {actionInProgress === notification.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Mark as Read
                    </Button>
                  )}
                </div>
              )}
              
              {(!notification.action_required || notification.status !== 'unread') && notification.status === 'unread' && (
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleNotificationAction(notification.id, 'read')}
                    disabled={actionInProgress === notification.id}
                    className="text-muted-foreground hover:text-foreground flex gap-1"
                  >
                    {actionInProgress === notification.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    Mark as Read
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
