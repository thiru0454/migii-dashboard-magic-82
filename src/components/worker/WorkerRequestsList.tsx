import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

export function WorkerRequestsList() {
  const [requests, setRequests] = useState<WorkerRequest[]>([]);

  useEffect(() => {
    // Load requests from localStorage
    const loadRequests = () => {
      const storedRequests = JSON.parse(localStorage.getItem('workerRequests') || '[]');
      setRequests(storedRequests);
    };

    loadRequests();
    // Set up interval to check for new requests
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (requestId: string, newStatus: "approved" | "rejected") => {
    try {
      const updatedRequests = requests.map(request => {
        if (request.id === requestId) {
          return { ...request, status: newStatus };
        }
        return request;
      });

      localStorage.setItem('workerRequests', JSON.stringify(updatedRequests));
      setRequests(updatedRequests);
      toast.success(`Request ${newStatus} successfully!`);
    } catch (error) {
      console.error("Error updating request status:", error);
      toast.error("Failed to update request status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Worker Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground">No worker requests found</p>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{request.businessName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Contact: {request.contactPerson} ({request.email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Phone: {request.phone}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="mt-2">
                  <p className="text-sm">
                    <span className="font-medium">Required Skills:</span> {request.requiredSkills}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Number of Workers:</span> {request.numberOfWorkers}
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Description:</span> {request.description}
                  </p>
                </div>

                {request.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleStatusChange(request.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange(request.id, "rejected")}
                    >
                      Reject
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