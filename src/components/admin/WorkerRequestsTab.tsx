import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkerRequest } from "@/components/business/RequestWorkersForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkerRequestsTabProps {
  requests: WorkerRequest[];
  onUpdateRequest: (requestId: string, status: "approved" | "rejected") => void;
}

export function WorkerRequestsTab({ requests, onUpdateRequest }: WorkerRequestsTabProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filteredRequests = requests.filter(request => 
    filter === "all" ? true : request.status === filter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Worker Requests</h2>
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredRequests.map((request, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Request #{index + 1}</CardTitle>
                {getStatusBadge(request.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Business ID:</strong> {request.businessId}</p>
                <p><strong>Number of Workers:</strong> {request.numberOfWorkers}</p>
                <p><strong>Skills Required:</strong> {request.skillsRequired.join(", ")}</p>
                <p><strong>Start Date:</strong> {request.startDate}</p>
                <p><strong>End Date:</strong> {request.endDate}</p>
                <p><strong>Additional Notes:</strong> {request.additionalNotes}</p>
                
                {request.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="success"
                      onClick={() => onUpdateRequest(request.businessId, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => onUpdateRequest(request.businessId, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 