import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAllWorkersFromStorage } from "@/utils/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, User, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WorkerRequest {
  id: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  requiredSkills: string;
  numberOfWorkers: number;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Load current business user
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.type !== 'business') {
        console.error('Current user is not a business');
        return;
      }

      // Load requests for this business
      const storedRequests = JSON.parse(localStorage.getItem('workerRequests') || '[]');
      const businessRequests = storedRequests.filter(
        (request: WorkerRequest) => request.businessName === currentUser.businessName
      );
      setRequests(businessRequests);

      // Load all workers
      const allWorkers = getAllWorkersFromStorage();
      setWorkers(allWorkers);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
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
    window.location.href = `tel:${phone}`;
  };

  const handleMessageWorker = (phone: string) => {
    window.location.href = `sms:${phone}`;
  };

  if (loading) {
    return <div>Loading data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Worker Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Date</TableHead>
                <TableHead>Required Skills</TableHead>
                <TableHead>Workers Needed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Selected Workers</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{request.requiredSkills}</TableCell>
                    <TableCell>{request.numberOfWorkers}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.selectedWorkers && request.selectedWorkers.length > 0 ? (
                        <div className="space-y-2">
                          {request.selectedWorkers.map(workerId => {
                            const worker = getWorkerDetails(workerId);
                            return worker ? (
                              <div key={workerId} className="flex items-center justify-between p-2 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{worker.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {worker.skill} • {worker.phone}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCallWorker(worker.phone)}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMessageWorker(worker.phone)}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No workers selected</span>
                      )}
                    </TableCell>
                    <TableCell>{request.description}</TableCell>
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