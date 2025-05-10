
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { T } from "@/components/T";
import { Check, X, Building, Calendar } from "lucide-react";

interface WorkerAssignment {
  id: string;
  worker_id: string;
  business_id: string;
  business_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  job_description?: string;
  skill_required?: string;
  duration?: string;
}

export function WorkerAssignmentTab() {
  const [assignments, setAssignments] = useState<WorkerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
    // Real-time subscription
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
    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const { data, error } = await supabase
        .from("worker_assignments")
        .select("*, worker_requests(skill, description, duration)")
        .eq("worker_id", currentUser.id)
        .order("created_at", { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Format the data
      const formattedData = data?.map(item => ({
        ...item,
        skill_required: item.worker_requests?.skill || "",
        job_description: item.worker_requests?.description || "",
        duration: item.worker_requests?.duration || ""
      })) || [];
      
      setAssignments(formattedData);
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast.error("Failed to load your assignments");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (assignmentId: string, newStatus: "accepted" | "declined") => {
    setActionInProgress(assignmentId);
    try {
      const { error } = await supabase
        .from("worker_assignments")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", assignmentId);
        
      if (error) throw error;
      
      // Update local state
      setAssignments(prev => 
        prev.map(assignment => assignment.id === assignmentId ? { ...assignment, status: newStatus } : assignment)
      );
      
      // Create notification for business
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        await supabase
          .from('business_notifications')
          .insert({
            business_id: assignment.business_id,
            type: `worker_${newStatus}`,
            message: `A worker has ${newStatus} your job assignment`,
            created_at: new Date().toISOString(),
            read: false,
            worker_id: assignment.worker_id
          });
      }
      
      toast.success(`Assignment ${newStatus} successfully!`);
    } catch (error) {
      console.error(`Error changing assignment status to ${newStatus}:`, error);
      toast.error(`Failed to ${newStatus} the assignment`);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-500 text-white">Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 flex justify-center">
          <LoadingSpinner text="Loading your assignments..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Job Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-center text-muted-foreground p-4">No assignments found</p>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id} className="p-4 hover-glow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building size={18} className="text-muted-foreground" />
                      <h3 className="font-semibold">{assignment.business_name}</h3>
                    </div>
                    <div className="flex gap-2 items-center mt-1 text-sm text-muted-foreground">
                      <Calendar size={16} />
                      <span>{new Date(assignment.created_at).toLocaleDateString()}</span>
                    </div>
                    {assignment.skill_required && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Required Skill:</span> {assignment.skill_required}
                      </p>
                    )}
                    {assignment.duration && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Duration:</span> {assignment.duration}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(assignment.status)}
                </div>
                {assignment.job_description && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Description:</span> {assignment.job_description}
                    </p>
                  </div>
                )}
                {assignment.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="bg-green-500 text-white hover:bg-green-600"
                      onClick={() => handleStatusChange(assignment.id, "accepted")}
                      disabled={actionInProgress === assignment.id}
                    >
                      {actionInProgress === assignment.id ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-1" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(assignment.id, "declined")}
                      disabled={actionInProgress === assignment.id}
                    >
                      {actionInProgress === assignment.id ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-1" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
