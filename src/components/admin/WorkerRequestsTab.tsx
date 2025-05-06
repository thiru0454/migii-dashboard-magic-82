import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getAllRegisteredWorkers } from "@/services/workerService";

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
}

export function WorkerRequestsTab() {
  const [requests, setRequests] = useState<WorkerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WorkerRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");

  useEffect(() => {
    loadRequests();
    // Add real-time subscription
    const channel = supabase
      .channel('worker_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_requests',
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("worker_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error loading requests:", error);
      setRequests([]);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleViewRequest = (request: WorkerRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleApproveReject = (action: "approve" | "reject") => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedRequest || !confirmAction) return;
    const newStatus = confirmAction === "approve" ? "approved" : "rejected";
    await supabase
      .from("worker_requests")
      .update({ status: newStatus })
      .eq("id", selectedRequest.id);
    setConfirmOpen(false);
    setDialogOpen(false);
    setSelectedRequest(null);
    setConfirmAction(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-500",
        icon: <AlertCircle className="h-4 w-4 mr-1" />,
        text: "Pending"
      },
      approved: {
        color: "bg-green-500",
        icon: <CheckCircle2 className="h-4 w-4 mr-1" />,
        text: "Approved"
      },
      rejected: {
        color: "bg-red-500",
        icon: <XCircle className="h-4 w-4 mr-1" />,
        text: "Rejected"
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];

    return (
      <Badge className={`${config.color} text-white flex items-center`}>
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  // Open assign dialog and fetch available workers
  const handleAssignWorker = async () => {
    if (!selectedRequest) return;
    setAssignDialogOpen(true);
    // Fetch available workers with matching skill and status 'Active'
    const allWorkers = await getAllRegisteredWorkers();
    console.log("All workers:", allWorkers);
    console.log("Request skill:", selectedRequest.skill);
    const filtered = allWorkers || [];
    setAvailableWorkers(filtered);
    setSelectedWorkerId("");
  };

  // Assign worker to request
  const handleConfirmAssign = async () => {
    if (!selectedRequest || !selectedWorkerId) return;
    const worker = availableWorkers.find(w => w.id === selectedWorkerId);
    await supabase
      .from("worker_requests")
      .update({
        assigned_worker_id: worker.id,
        assigned_worker_name: worker.name,
        status: "assigned"
      })
      .eq("id", selectedRequest.id);
    setAssignDialogOpen(false);
    setDialogOpen(false);
    setSelectedRequest(null);
  };

  if (loading) {
    return <div>Loading requests...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Worker Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Required Skills</TableHead>
                <TableHead>Workers Needed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.business_name}</TableCell>
                    <TableCell>{request.skill}</TableCell>
                    <TableCell>{request.workers_needed}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewRequest(request)}
                      >
                        View Request
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {/* Request Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Worker Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <strong>Business Name:</strong> {selectedRequest.business_name}
              </div>
              <div>
                <strong>Skill Required:</strong> {selectedRequest.skill}
              </div>
              <div>
                <strong>Workers Needed:</strong> {selectedRequest.workers_needed}
              </div>
              <div>
                <strong>Priority:</strong> {selectedRequest.priority}
              </div>
              <div>
                <strong>Duration:</strong> {selectedRequest.duration}
              </div>
              <div>
                <strong>Description:</strong> {selectedRequest.description}
              </div>
              <div>
                <strong>Status:</strong> {getStatusBadge(selectedRequest.status)}
              </div>
              {/* Approve/Reject only if pending */}
              {selectedRequest.status === "pending" && (
                <div className="flex gap-4 mt-4">
                  <Button className="bg-green-500 text-white" onClick={() => handleApproveReject("approve")}>Approve</Button>
                  <Button className="bg-red-500 text-white" onClick={() => handleApproveReject("reject")}>Reject</Button>
                </div>
              )}
              {/* After approval, show Assign Worker button */}
              {selectedRequest.status === "approved" && (
                <>
                  <Button className="bg-blue-600 text-white mt-4" onClick={handleAssignWorker}>Assign Worker</Button>
                  <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Assign Worker</DialogTitle>
                      </DialogHeader>
                      <div className="mb-4">
                        <label className="block mb-2">Select Worker:</label>
                        <select
                          className="w-full border rounded p-2"
                          value={selectedWorkerId}
                          onChange={e => setSelectedWorkerId(e.target.value)}
                        >
                          <option value="">-- Select --</option>
                          {availableWorkers.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.skill})</option>
                          ))}
                        </select>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleConfirmAssign} disabled={!selectedWorkerId}>Assign</Button>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          )}
          {/* Confirmation Dialog */}
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Confirm Action</DialogTitle>
              </DialogHeader>
              <div>Are you sure you want to {confirmAction} this request?</div>
              <DialogFooter>
                <Button onClick={handleConfirm}>Yes</Button>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
