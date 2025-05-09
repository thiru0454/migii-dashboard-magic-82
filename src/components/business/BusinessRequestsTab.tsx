
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAllWorkersFromStorage } from "@/utils/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, User, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SKILLS } from "@/constants/skills";

interface WorkerRequest {
  id: string;
  business_id: string;
  business_name: string;
  workers_needed: number;
  skill: string;
  priority: string;
  duration: string;
  description: string;
  status: string;
  created_at: string;
  assigned_worker_name?: string;
  assigned_worker_id?: string;
  assignedWorkers?: string[];
  selectedWorkers?: string[];
}

interface Worker {
  id: string;
  name: string;
  phone: string;
  skill: string;
  status: string;
}

export function BusinessRequestsTab() {
  const [requests, setRequests] = useState<WorkerRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // For tracking individual actions

  useEffect(() => {
    loadRequests();
    loadWorkers();
    
    // Real-time subscription
    const channel = supabase
      .channel('worker_requests_business_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_requests',
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          loadRequests();
        }
      )
      .subscribe();

    // Also subscribe to worker_assignments table
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
          console.log('Worker assignment updated');
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const { data, error } = await supabase
        .from("worker_requests")
        .select("*")
        .eq("business_id", currentUser.id)
        .order("created_at", { ascending: false });
        
      if (error) {
        throw error;
      }
      
      console.log("Business requests loaded:", data);
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Failed to load worker requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };
  
  const loadWorkers = async () => {
    try {
      // Try to load from Supabase first
      const { data: supabaseWorkers, error } = await supabase
        .from("workers")
        .select("*");
        
      if (error) {
        console.error("Error loading workers from Supabase:", error);
        // Fall back to localStorage
        const workersData = await getAllWorkersFromStorage();
        setWorkers(workersData || []);
      } else {
        // Format workers from Supabase
        const formattedWorkers = supabaseWorkers.map(w => ({
          id: w.id,
          name: w.name,
          phone: w.phone,
          skill: w.primary_skill || w.skill || "",
          status: w.status
        }));
        setWorkers(formattedWorkers);
      }
    } catch (error) {
      console.error("Error loading workers:", error);
      const workersData = await getAllWorkersFromStorage();
      setWorkers(workersData || []);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "assigned":
        return (
          <Badge className="bg-blue-500 text-white flex items-center gap-1">
            <User className="h-3 w-3" />
            Worker Assigned
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-600 text-white flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Worker Accepted
          </Badge>
        );
      case "declined":
        return (
          <Badge className="bg-red-600 text-white flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Worker Declined
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWorkerDetails = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return null;
    return {
      name: worker.name,
      skill: worker.skill,
      phone: worker.phone
    };
  };

  const handleCallWorker = (phone: string) => {
    setActionLoading("calling");
    try {
      window.location.href = `tel:${phone}`;
    } finally {
      // Reset after short delay
      setTimeout(() => setActionLoading(null), 1000);
    }
  };

  const handleMessageWorker = (phone: string) => {
    setActionLoading("messaging");
    try {
      window.location.href = `sms:${phone}`;
    } finally {
      // Reset after short delay
      setTimeout(() => setActionLoading(null), 1000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner text="Loading worker requests..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Your Worker Requests</CardTitle>
        <Button 
          variant="outline" 
          onClick={loadRequests} 
          className="bg-primary/10 hover:bg-primary/20"
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Date</TableHead>
                <TableHead>Required Skills</TableHead>
                <TableHead className="hidden sm:table-cell">Workers Needed</TableHead>
                <TableHead>Assigned Worker</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-accent/30">
                    <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10">
                        {request.skill}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{request.workers_needed}</TableCell>
                    <TableCell>
                      {request.assigned_worker_name ? (
                        <span className="font-medium text-blue-700">{request.assigned_worker_name}</span>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px]">
                      <div className="truncate">{request.description || "No description"}</div>
                    </TableCell>
                    <TableCell>
                      {request.status === "assigned" || request.status === "accepted" ? (
                        request.assigned_worker_id && getWorkerDetails(request.assigned_worker_id) ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCallWorker(getWorkerDetails(request.assigned_worker_id!)!.phone)}
                              disabled={actionLoading === "calling"}
                              className="bg-green-100 hover:bg-green-200 text-green-800"
                            >
                              {actionLoading === "calling" ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Phone className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMessageWorker(getWorkerDetails(request.assigned_worker_id!)!.phone)}
                              disabled={actionLoading === "messaging"}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800"
                            >
                              {actionLoading === "messaging" ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <MessageSquare className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Contact info loading...</span>
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {request.status === "pending" ? "Awaiting review" : 
                           request.status === "approved" ? "Awaiting assignment" : 
                           request.status === "rejected" ? "Request rejected" : 
                           request.status === "declined" ? "Worker declined" : ""}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
