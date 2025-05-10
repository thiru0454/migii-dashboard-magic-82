
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Briefcase, Calendar, Building, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Assignment {
  id: string;
  business_id: string;
  business_name: string;
  worker_id: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  created_at: string;
  job_description?: string;
  job_location?: string;
  duration?: string;
  start_date?: string;
  skill_required?: string;
}

export function WorkerAssignmentTab() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('worker_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_assignments',
        },
        () => {
          loadAssignments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      // Get current user ID from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || !currentUser.id) {
        console.warn("No user ID found in localStorage");
        setAssignments([]);
        return;
      }
      
      // Query both worker_assignments table
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('worker_assignments')
        .select('*')
        .eq('worker_id', currentUser.id)
        .order('created_at', { ascending: false });
        
      if (assignmentsError) {
        throw assignmentsError;
      }

      // Also look in worker_requests for assignments to this worker
      const { data: requestsData, error: requestsError } = await supabase
        .from('worker_requests')
        .select('*')
        .eq('assigned_worker_id', currentUser.id)
        .order('created_at', { ascending: false });
        
      if (requestsError) {
        console.error("Error fetching from worker_requests:", requestsError);
      }
      
      // Process data from worker_assignments
      const formattedAssignments = (assignmentsData || []).map(assignment => ({
        id: assignment.id,
        business_id: assignment.business_id,
        business_name: assignment.business_name || "Business",
        worker_id: assignment.worker_id,
        status: assignment.status,
        created_at: assignment.created_at,
        job_description: assignment.job_description || "No description provided",
        job_location: assignment.location || "Not specified",
        duration: assignment.duration || "Not specified",
        start_date: assignment.start_date || null,
        skill_required: assignment.skill_required || "Not specified"
      }));
      
      // Process data from worker_requests
      const assignmentsFromRequests = (requestsData || []).map(request => ({
        id: `req-${request.id}`,
        business_id: request.business_id,
        business_name: request.business_name || "Business",
        worker_id: request.assigned_worker_id,
        status: "pending" as const,
        created_at: request.created_at,
        job_description: request.description || "No description provided",
        job_location: "Not specified",
        duration: request.duration || "Not specified",
        start_date: null,
        skill_required: request.skill || "Not specified"
      }));
      
      // Combine both sources, avoiding duplicates by business_id
      const combinedAssignments = [...formattedAssignments];
      assignmentsFromRequests.forEach(req => {
        if (!combinedAssignments.some(a => a.business_id === req.business_id)) {
          combinedAssignments.push(req);
        }
      });
      
      setAssignments(combinedAssignments);
      
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (assignmentId: string, newStatus: "accepted" | "rejected") => {
    try {
      setUpdatingId(assignmentId);
      
      // Check if it's a request-derived assignment
      const isRequestDerived = assignmentId.startsWith('req-');
      const actualId = isRequestDerived ? assignmentId.substring(4) : assignmentId;
      const assignment = assignments.find(a => a.id === assignmentId);
      
      if (!assignment) {
        throw new Error("Assignment not found");
      }
      
      if (isRequestDerived) {
        // It's from worker_requests table
        const { error } = await supabase
          .from('worker_assignments')
          .insert({
            worker_id: assignment.worker_id,
            business_id: assignment.business_id,
            business_name: assignment.business_name,
            status: newStatus,
            job_description: assignment.job_description,
            skill_required: assignment.skill_required,
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
        
        // Update the worker_requests entry status
        await supabase
          .from('worker_requests')
          .update({
            status: newStatus === 'accepted' ? 'confirmed' : 'rejected'
          })
          .eq('id', actualId);
      } else {
        // It's already in worker_assignments table
        const { error } = await supabase
          .from('worker_assignments')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', assignmentId);
          
        if (error) throw error;
      }
      
      // Update local state
      setAssignments(prev => 
        prev.map(a => 
          a.id === assignmentId 
            ? { ...a, status: newStatus } 
            : a
        )
      );
      
      // Create notification for the business
      await supabase.from('business_notifications').insert({
        business_id: assignment.business_id,
        type: newStatus === 'accepted' ? 'assignment_accepted' : 'assignment_rejected',
        message: `Worker ${newStatus === 'accepted' ? 'accepted' : 'rejected'} your assignment request`,
        worker_id: assignment.worker_id,
        worker_name: JSON.parse(localStorage.getItem('currentUser') || '{}')?.name || "Worker",
        read: false,
        created_at: new Date().toISOString()
      });
      
      toast.success(`Assignment ${newStatus} successfully`);
      
    } catch (error) {
      console.error(`Error updating assignment status to ${newStatus}:`, error);
      toast.error("Failed to update assignment status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return <Badge className="bg-slate-500">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner text="Loading your assignments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">No assignments yet</p>
            <p className="text-muted-foreground">
              You don't have any job assignments yet. When businesses assign you to jobs, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    {assignment.business_name}
                  </CardTitle>
                  <CardDescription>
                    Assigned on {new Date(assignment.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                {getStatusBadge(assignment.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Job Description</p>
                  <p className="text-sm text-muted-foreground">{assignment.job_description}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Duration</p>
                  <p className="text-sm text-muted-foreground">{assignment.duration}</p>
                </div>
              </div>
              {assignment.skill_required && (
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium text-sm">Skills Required</p>
                    <Badge variant="outline" className="mt-1">
                      {assignment.skill_required}
                    </Badge>
                  </div>
                </div>
              )}
              {assignment.job_location && assignment.job_location !== "Not specified" && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Location</p>
                    <p className="text-sm text-muted-foreground">{assignment.job_location}</p>
                  </div>
                </div>
              )}
              {assignment.start_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Start Date</p>
                    <p className="text-sm text-muted-foreground">{new Date(assignment.start_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
            {assignment.status === "pending" && (
              <CardFooter className="flex gap-3 justify-end pt-0">
                <Button 
                  variant="outline" 
                  className="border-red-500 text-red-500 hover:bg-red-50" 
                  onClick={() => handleUpdateStatus(assignment.id, "rejected")}
                  disabled={updatingId === assignment.id}
                >
                  {updatingId === assignment.id && (
                    <LoadingSpinner size="sm" className="mr-2" />
                  )}
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  className="bg-green-500 hover:bg-green-600" 
                  onClick={() => handleUpdateStatus(assignment.id, "accepted")}
                  disabled={updatingId === assignment.id}
                >
                  {updatingId === assignment.id && (
                    <LoadingSpinner size="sm" className="mr-2" />
                  )}
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </CardFooter>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
