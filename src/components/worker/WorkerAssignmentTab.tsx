// Only showing the necessary changes to the component props interface and initial part
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface WorkerAssignmentTabProps {
  workerId?: string | null;
}

export function WorkerAssignmentTab({ workerId }: WorkerAssignmentTabProps) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const effectiveWorkerId = workerId || JSON.parse(localStorage.getItem('currentUser') || '{}')?.id;
    
    if (!effectiveWorkerId) {
      setLoading(false);
      console.warn("No worker ID found");
      return;
    }
    
    fetchAssignments(effectiveWorkerId);
    
    // Set up real-time subscription
    const channel = supabase
      .channel('worker_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_assignments',
          filter: `worker_id=eq.${effectiveWorkerId}`,
        },
        (payload) => {
          console.log("Assignment change detected:", payload);
          fetchAssignments(effectiveWorkerId);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId]);

  const fetchAssignments = async (workerId: string) => {
    try {
      console.log("Fetching assignments for worker ID:", workerId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('worker_assignments')
        .select(`
          *,
          business:business_id (
            id,
            name,
            email,
            phone,
            address
          )
        `)
        .eq('worker_id', workerId);
        
      if (error) {
        throw error;
      }
      
      console.log("Assignments loaded:", data?.length || 0, "assignments found");
      setAssignments(data || []);
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner text="Loading assignments..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <p className="text-center text-gray-500">No assignments found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignments.map((assignment: any) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold">{assignment.job_description}</h3>
              <p className="text-gray-600">
                Business: {assignment.business?.name || 'N/A'}
              </p>
              <p className="text-gray-600">
                Location: {assignment.location || 'N/A'}
              </p>
              <p className="text-gray-600">
                Duration: {assignment.duration || 'N/A'}
              </p>
              <p className="text-gray-600">
                Status: {assignment.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
