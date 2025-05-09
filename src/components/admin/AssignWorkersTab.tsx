
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { MigrantWorker, Worker } from "@/types/worker";
import { useWorkers } from "@/hooks/useWorkers";
import { assignWorkerToBusiness } from "@/services/workerService"; 
import { supabase } from "@/lib/supabase";
import { SKILLS } from "@/constants/skills";

interface WorkerRequest {
  id: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  requiredSkills: string;
  numberOfWorkers: number;
  description: string;
  status: "pending" | "approved" | "rejected" | "assigned";
  createdAt: string;
  assignedWorkers?: string[];
  business_id?: string;
  business_name?: string;
  workers_needed?: number;
  skill?: string;
}

export function AssignWorkersTab() {
  const [requests, setRequests] = useState<WorkerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkers, setSelectedWorkers] = useState<{ [key: string]: string[] }>({});
  const { workers, isLoadingWorkers } = useWorkers();
  const [assigningWorkers, setAssigningWorkers] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load approved requests from localStorage and supabase
      const storedRequests = JSON.parse(localStorage.getItem('workerRequests') || '[]');
      
      // Also load from Supabase
      const { data: supabaseRequests, error } = await supabase.from("worker_requests")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error loading requests from Supabase:", error);
      }
      
      // Combine both sources of requests and format them consistently
      const approvedStoredRequests = storedRequests.filter((request: any) => 
        request.status === "approved"
      );
      
      // Format Supabase requests to match local format with required WorkerRequest fields
      const formattedSupabaseRequests = (supabaseRequests || []).map((req: any) => ({
        id: req.id,
        businessName: req.business_name,
        business_id: req.business_id,
        requiredSkills: req.skill,
        numberOfWorkers: req.workers_needed,
        status: req.status as WorkerRequest["status"],
        createdAt: req.created_at,
        description: req.description,
        skill: req.skill,
        assignedWorkers: req.assigned_workers || [],
        // Add required fields from WorkerRequest interface with default values
        contactPerson: req.contact_person || "",
        phone: req.phone || "",
        email: req.email || ""
      }));
      
      // Combine and deduplicate by ID
      const combinedRequests: WorkerRequest[] = [...approvedStoredRequests];
      formattedSupabaseRequests.forEach((req: WorkerRequest) => {
        if (!combinedRequests.find(r => r.id === req.id)) {
          combinedRequests.push(req);
        }
      });
      
      console.log("Combined requests:", combinedRequests);
      setRequests(combinedRequests);

      // Initialize selected workers for each request
      const initialSelectedWorkers: { [key: string]: string[] } = {};
      combinedRequests.forEach((request: WorkerRequest) => {
        initialSelectedWorkers[request.id] = request.assignedWorkers || [];
      });
      setSelectedWorkers(initialSelectedWorkers);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load worker requests");
    } finally {
      setLoading(false);
    }
  };

  // Convert MigrantWorker array to Worker array with consistent types
  const getAvailableWorkers = () => {
    // Log worker data for debugging
    console.log("All workers:", workers);
    
    // Filter only active workers
    return workers.filter((worker: MigrantWorker) => 
      worker.status === "active"
    ).map((worker: MigrantWorker): Worker => ({
      id: String(worker.id),
      name: worker.name,
      phone: worker.phone,
      // Fix the skill extraction logic to use correct property names
      skill: worker.skill || worker.primarySkill || worker["Primary Skill"] || "",
      status: worker.status,
      originState: worker.originState || worker["Origin State"] || "",
      age: worker.age,
      email: worker.email,
      photoUrl: worker.photoUrl || worker["Photo URL"] || "",
      aadhaar: worker.aadhaar || worker["Aadhaar Number"] || ""
    }));
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

  const assignWorkers = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const maxWorkers = request.numberOfWorkers || request.workers_needed || 1;
      if (selectedWorkers[requestId].length > maxWorkers) {
        toast.error(`Cannot assign more than ${maxWorkers} workers`);
        return;
      }
      
      setAssigningWorkers(prev => ({ ...prev, [requestId]: true }));

      // Ensure all worker IDs are strings before sending them to Supabase
      const workersToAssign = selectedWorkers[requestId].map(id => String(id));
      
      console.log('Workers to assign:', workersToAssign);
      console.log('Request details:', request);

      // Get business ID (may be in different fields based on source)
      const businessId = request.business_id || request.id;

      // Assign each worker to the business
      const workerPromises = workersToAssign.map(async (workerId) => {
        try {
          console.log(`Attempting to assign worker ${workerId} to business ${businessId}`);
          const result = await assignWorkerToBusiness(workerId, businessId);
          
          if (result && result.error) {
            console.error(`Error assigning worker ${workerId}:`, result.error);
            return false;
          }
          
          // Also update the worker_requests table with the assigned worker
          const { error: updateError } = await supabase
            .from("worker_requests")
            .update({ 
              assigned_worker_id: workerId,
              assigned_worker_name: getWorkerName(workerId).split(' (')[0],
              status: "assigned" 
            })
            .eq("id", requestId);
            
          if (updateError) {
            console.error("Error updating request:", updateError);
          }
          
          console.log(`Successfully assigned worker ${workerId} to business ${businessId}`);
          return true;
        } catch (err) {
          console.error(`Exception assigning worker ${workerId}:`, err);
          return false;
        }
      });

      const results = await Promise.all(workerPromises);
      
      // Check if all workers were assigned successfully
      if (results.every(r => r === true)) {
        const updatedRequests = requests.map(r => {
          if (r.id === requestId) {
            return {
              ...r,
              assignedWorkers: selectedWorkers[requestId],
              status: "assigned" as const
            };
          }
          return r;
        });

        setRequests(updatedRequests);
        localStorage.setItem('workerRequests', JSON.stringify(updatedRequests));
        toast.success("Workers assigned successfully!");
      } else {
        toast.error("Failed to assign one or more workers. Please try again.");
      }
    } catch (error) {
      console.error("Error assigning workers:", error);
      toast.error("Failed to assign workers. Please try again.");
    } finally {
      setAssigningWorkers(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const getWorkerName = (workerId: string) => {
    const availableWorkers = getAvailableWorkers();
    const worker = availableWorkers.find(w => w.id === workerId);
    return worker ? `${worker.name} (${worker.skill})` : "Unknown Worker";
  };

  // Function to determine if a worker's skills match the required skills
  const workerMatchesSkill = (worker: Worker, requiredSkill: string) => {
    // For empty required skill, show all workers
    if (!requiredSkill) return true;
    
    // Handle case where worker skill or required skill is undefined
    const workerSkill = (worker.skill || '').toLowerCase();
    const required = requiredSkill.toLowerCase();
    
    // Look for partial matches too
    return workerSkill.includes(required) || required.includes(workerSkill);
  };

  if (loading || isLoadingWorkers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader text-primary text-xl"></div>
        <span className="ml-3 text-muted-foreground">Loading data...</span>
      </div>
    );
  }

  const availableWorkers = getAvailableWorkers();

  return (
    <Card className="bg-gradient-to-br from-card to-background border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl md:text-2xl text-gradient-primary">Assign Workers to Approved Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto max-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead className="hidden sm:table-cell">Required Skills</TableHead>
                <TableHead className="hidden sm:table-cell">Workers Needed</TableHead>
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
                requests.map((request) => {
                  // Get skill from appropriate field depending on data source
                  const requiredSkill = request.requiredSkills || request.skill || "";
                  const workersNeeded = request.numberOfWorkers || request.workers_needed || 1;
                  
                  // Filter workers based on the required skill
                  const matchingWorkers = availableWorkers.filter(worker => 
                    worker.status === "active" && 
                    !selectedWorkers[request.id]?.includes(worker.id) &&
                    workerMatchesSkill(worker, requiredSkill)
                  );
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.businessName || request.business_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{requiredSkill}</TableCell>
                      <TableCell className="hidden sm:table-cell">{workersNeeded}</TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(value) => handleWorkerSelection(request.id, value)}
                        >
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select worker" />
                          </SelectTrigger>
                          <SelectContent>
                            {matchingWorkers.length > 0 ? 
                              matchingWorkers.map(worker => (
                                <SelectItem key={worker.id} value={worker.id}>
                                  {worker.name} ({worker.skill})
                                </SelectItem>
                              )) : (
                                <div className="px-4 py-2 text-muted-foreground">No matching workers available</div>
                              )
                            }
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {selectedWorkers[request.id]?.map(workerId => (
                            <div key={workerId} className="flex items-center justify-between">
                              <span className="text-sm truncate max-w-[120px] sm:max-w-[180px]">{getWorkerName(workerId)}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleWorkerSelection(request.id, workerId)}
                                className="ml-2"
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
                          disabled={!selectedWorkers[request.id]?.length || assigningWorkers[request.id]}
                          className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto"
                        >
                          {assigningWorkers[request.id] ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Assign Workers
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
