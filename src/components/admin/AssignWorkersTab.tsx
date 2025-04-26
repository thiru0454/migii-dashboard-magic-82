import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllWorkersFromStorage } from "@/utils/firebase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, UserMinus } from "lucide-react";

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
  assignedWorkers?: string[];
}

interface Worker {
  id: string;
  name: string;
  phone: string;
  skill: string;
  status: string;
}

export function AssignWorkersTab() {
  const [requests, setRequests] = useState<WorkerRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkers, setSelectedWorkers] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Load approved requests
      const storedRequests = JSON.parse(localStorage.getItem('workerRequests') || '[]');
      const approvedRequests = storedRequests.filter((request: WorkerRequest) => 
        request.status === "approved"
      );
      setRequests(approvedRequests);

      // Load available workers
      const availableWorkers = getAllWorkersFromStorage().filter(
        (worker: Worker) => worker.status === "active"
      );
      setWorkers(availableWorkers);

      // Initialize selected workers for each request
      const initialSelectedWorkers: { [key: string]: string[] } = {};
      approvedRequests.forEach((request: WorkerRequest) => {
        initialSelectedWorkers[request.id] = request.assignedWorkers || [];
      });
      setSelectedWorkers(initialSelectedWorkers);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerSelection = (requestId: string, workerId: string) => {
    setSelectedWorkers(prev => {
      const currentWorkers = prev[requestId] || [];
      if (currentWorkers.includes(workerId)) {
        return {
          ...prev,
          [requestId]: currentWorkers.filter(id => id !== workerId)
        };
      } else {
        return {
          ...prev,
          [requestId]: [...currentWorkers, workerId]
        };
      }
    });
  };

  const assignWorkers = (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      if (selectedWorkers[requestId].length > request.numberOfWorkers) {
        toast.error(`Cannot assign more than ${request.numberOfWorkers} workers`);
        return;
      }

      const updatedRequests = requests.map(request => {
        if (request.id === requestId) {
          return {
            ...request,
            assignedWorkers: selectedWorkers[requestId]
          };
        }
        return request;
      });

      localStorage.setItem('workerRequests', JSON.stringify(updatedRequests));
      setRequests(updatedRequests);
      toast.success("Workers assigned successfully!");
    } catch (error) {
      console.error("Error assigning workers:", error);
      toast.error("Failed to assign workers. Please try again.");
    }
  };

  const getWorkerName = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    return worker ? `${worker.name} (${worker.skill})` : "Unknown Worker";
  };

  if (loading) {
    return <div>Loading data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Workers to Approved Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Required Skills</TableHead>
                <TableHead>Workers Needed</TableHead>
                <TableHead>Available Workers</TableHead>
                <TableHead>Assigned Workers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No approved requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.businessName}</TableCell>
                    <TableCell>{request.requiredSkills}</TableCell>
                    <TableCell>{request.numberOfWorkers}</TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) => handleWorkerSelection(request.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select worker" />
                        </SelectTrigger>
                        <SelectContent>
                          {workers
                            .filter(worker => 
                              worker.skill.toLowerCase().includes(request.requiredSkills.toLowerCase()) &&
                              !selectedWorkers[request.id]?.includes(worker.id)
                            )
                            .map(worker => (
                              <SelectItem key={worker.id} value={worker.id}>
                                {worker.name} ({worker.skill})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {selectedWorkers[request.id]?.map(workerId => (
                          <div key={workerId} className="flex items-center justify-between">
                            <span>{getWorkerName(workerId)}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleWorkerSelection(request.id, workerId)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => assignWorkers(request.id)}
                        disabled={!selectedWorkers[request.id]?.length}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Workers
                      </Button>
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