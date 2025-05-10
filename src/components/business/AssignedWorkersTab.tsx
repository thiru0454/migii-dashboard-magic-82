
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, UserCheck, User, Phone, Mail, Calendar, Clock, MapPin } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AssignedWorker {
  id: string;
  worker_id: string;
  worker_name: string;
  status: string;
  created_at: string;
  updated_at?: string;
  skill?: string;
  phone?: string;
  email?: string;
  origin_state?: string;
  age?: number;
  job_description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
}

interface NotificationPayload {
  new?: {
    type?: string;
    worker_name?: string;
    created_at?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export function AssignedWorkersTab() {
  const [workers, setWorkers] = useState<AssignedWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<AssignedWorker | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadAssignedWorkers();
    
    // Set up real-time subscription for worker assignments
    const assignmentsChannel = supabase
      .channel('worker_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_assignments',
        },
        () => {
          loadAssignedWorkers();
        }
      )
      .subscribe();
      
    // Also listen for notifications about worker actions
    const notificationsChannel = supabase
      .channel('business_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_notifications',
        },
        (payload: NotificationPayload) => {
          if (payload.new && 
              (payload.new.type === 'assignment_accepted' || 
               payload.new.type === 'assignment_rejected')) {
            loadAssignedWorkers();
            
            // Show toast notification
            const message = payload.new.type === 'assignment_accepted' 
              ? `${payload.new.worker_name || 'Worker'} accepted your assignment request`
              : `${payload.new.worker_name || 'Worker'} rejected your assignment request`;
              
            toast(message, {
              description: payload.new.created_at ? new Date(payload.new.created_at).toLocaleString() : ''
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  const loadAssignedWorkers = async () => {
    try {
      setLoading(true);
      
      // Get current business user
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      if (!currentUser || !currentUser.id || currentUser.userType !== 'business') {
        console.warn("No business user found in localStorage");
        setWorkers([]);
        return;
      }
      
      // Get worker assignments from primary table
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('worker_assignments')
        .select('*')
        .eq('business_id', currentUser.id)
        .order('created_at', { ascending: false });
        
      if (assignmentsError) {
        console.error("Error fetching worker assignments:", assignmentsError);
      }
      
      // Also get worker assignments from worker_requests table
      const { data: requestsData, error: requestsError } = await supabase
        .from('worker_requests')
        .select('*')
        .eq('business_id', currentUser.id)
        .not('assigned_worker_id', 'is', null)
        .order('created_at', { ascending: false });
        
      if (requestsError) {
        console.error("Error fetching worker requests:", requestsError);
      }
      
      // Format assignments data
      const assignedWorkers: AssignedWorker[] = [];
      
      // Add workers from assignments table
      if (assignmentsData) {
        assignmentsData.forEach(assignment => {
          // Fetch additional worker details
          fetchWorkerDetails(assignment.worker_id).then(workerDetails => {
            // Update the worker entry with additional details
            setWorkers(prev => prev.map(w => 
              w.worker_id === assignment.worker_id 
                ? { ...w, ...workerDetails } 
                : w
            ));
          });
          
          assignedWorkers.push({
            id: assignment.id,
            worker_id: assignment.worker_id,
            worker_name: assignment.worker_name || "Unknown Worker",
            status: assignment.status,
            created_at: assignment.created_at,
            updated_at: assignment.updated_at,
            skill: assignment.skill_required,
            job_description: assignment.job_description,
            location: assignment.location,
            start_date: assignment.start_date,
            end_date: assignment.end_date
          });
        });
      }
      
      // Add workers from requests table
      if (requestsData) {
        requestsData.forEach(request => {
          // Only add if not already added from assignments
          if (!assignedWorkers.some(w => w.worker_id === request.assigned_worker_id)) {
            // Fetch additional worker details
            fetchWorkerDetails(request.assigned_worker_id).then(workerDetails => {
              // Update the worker entry with additional details
              setWorkers(prev => prev.map(w => 
                w.worker_id === request.assigned_worker_id 
                  ? { ...w, ...workerDetails } 
                  : w
              ));
            });
            
            assignedWorkers.push({
              id: `req-${request.id}`,
              worker_id: request.assigned_worker_id,
              worker_name: request.assigned_worker_name || "Unknown Worker",
              status: "pending",
              created_at: request.created_at,
              skill: request.skill,
              job_description: request.description,
            });
          }
        });
      }
      
      setWorkers(assignedWorkers);
      
    } catch (error) {
      console.error("Error loading assigned workers:", error);
      toast.error("Failed to load assigned workers");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchWorkerDetails = async (workerId: string) => {
    try {
      // Query the workers table for additional details
      const { data, error } = await supabase
        .from('workers')
        .select('phone, email, origin_state, age, skill')
        .eq('id', workerId)
        .single();
        
      if (error) {
        console.warn(`Could not fetch details for worker ${workerId}:`, error);
        return {};
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching details for worker ${workerId}:`, error);
      return {};
    }
  };

  const handleViewDetails = (worker: AssignedWorker) => {
    setSelectedWorker(worker);
    setDetailsOpen(true);
  };

  const handleRemoveWorker = async (workerId: string, assignmentId: string) => {
    try {
      // Check if it's from requests table
      const isFromRequests = assignmentId.startsWith('req-');
      const actualId = isFromRequests ? assignmentId.substring(4) : assignmentId;
      
      if (isFromRequests) {
        // Update the worker_requests entry
        const { error } = await supabase
          .from('worker_requests')
          .update({
            assigned_worker_id: null,
            assigned_worker_name: null,
            status: "approved" // Reset to approved so it can be reassigned
          })
          .eq('id', actualId);
          
        if (error) throw error;
      } else {
        // Update the assignment status
        const { error } = await supabase
          .from('worker_assignments')
          .update({ 
            status: "terminated",
            updated_at: new Date().toISOString()
          })
          .eq('id', assignmentId);
          
        if (error) throw error;
      }
      
      // Create notification for the worker
      await supabase.from('notifications').insert({
        user_id: workerId,
        type: 'assignment_terminated',
        message: 'Your job assignment has been terminated by the business',
        read: false,
        created_at: new Date().toISOString()
      });
      
      // Update local state
      setWorkers(prev => prev.filter(w => w.id !== assignmentId));
      
      toast.success("Worker assignment removed");
      
      // Close dialog if open
      if (detailsOpen && selectedWorker?.id === assignmentId) {
        setDetailsOpen(false);
        setSelectedWorker(null);
      }
      
    } catch (error) {
      console.error("Error removing worker assignment:", error);
      toast.error("Failed to remove worker assignment");
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending Response</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'terminated':
        return <Badge className="bg-slate-500">Terminated</Badge>;
      default:
        return <Badge className="bg-slate-500">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner text="Loading your assigned workers..." />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Workers
          </CardTitle>
          <CardDescription>
            View and manage workers assigned to your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <div className="py-8 text-center">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No assigned workers yet</p>
              <p className="text-muted-foreground">
                When workers are assigned to your business, they will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignment Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{worker.worker_name}</TableCell>
                    <TableCell>{worker.skill || "Not specified"}</TableCell>
                    <TableCell>{getStatusBadge(worker.status)}</TableCell>
                    <TableCell>{new Date(worker.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(worker)}
                        >
                          Details
                        </Button>
                        {worker.status !== "terminated" && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRemoveWorker(worker.worker_id, worker.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {selectedWorker && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Worker Details</DialogTitle>
              <DialogDescription>
                Information about the assigned worker
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 pb-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedWorker.worker_name}</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedWorker.worker_id}</p>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedWorker.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 border-t pt-4">
                {selectedWorker.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{selectedWorker.phone}</p>
                    </div>
                  </div>
                )}
                
                {selectedWorker.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{selectedWorker.email}</p>
                    </div>
                  </div>
                )}
                
                {selectedWorker.skill && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">{selectedWorker.skill}</Badge>
                    </div>
                  </div>
                )}
                
                {selectedWorker.origin_state && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Origin State</p>
                      <p>{selectedWorker.origin_state}</p>
                    </div>
                  </div>
                )}
                
                {selectedWorker.job_description && (
                  <div className="col-span-2 space-y-1 border-t pt-4">
                    <p className="text-sm font-medium">Job Description</p>
                    <p className="text-sm">{selectedWorker.job_description}</p>
                  </div>
                )}
                
                {(selectedWorker.start_date || selectedWorker.location) && (
                  <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                    {selectedWorker.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Start Date</p>
                          <p>{new Date(selectedWorker.start_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedWorker.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p>{selectedWorker.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              {selectedWorker.status !== "terminated" && (
                <Button 
                  variant="destructive"
                  onClick={() => handleRemoveWorker(selectedWorker.worker_id, selectedWorker.id)}
                >
                  Remove Worker
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
