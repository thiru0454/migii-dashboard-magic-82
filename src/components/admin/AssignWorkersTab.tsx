import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, UserMinus, Loader2, RefreshCw } from "lucide-react";
import { MigrantWorker, Worker } from "@/types/worker";
import { useWorkers } from "@/hooks/useWorkers";
import { assignWorkerToBusiness } from "@/services/workerService"; 
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { T } from "@/components/T";

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
  duration?: string;
}

export function AssignWorkersTab() {
  const [requests, setRequests] = useState<WorkerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<{ [key: string]: string[] }>({});
  const { workers, isLoadingWorkers } = useWorkers();
  const [assigningWorkers, setAssigningWorkers] = useState<{[key: string]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
    
    // Set up real-time subscription to worker_requests table
    const requestsChannel = supabase
      .channel('worker_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_requests',
        },
        () => {
          console.log("Worker requests changed, refreshing data");
          loadData();
        }
      )
      .subscribe();
      
    // Also subscribe to worker_notifications table for assignment status changes
    const notificationsChannel = supabase
      .channel('worker_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_notifications',
        },
        () => {
          console.log("Worker notifications changed, refreshing data");
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load approved requests from localStorage and supabase
      const storedRequests = JSON.parse(localStorage.getItem('workerRequests') || '[]');
      
      // Also load from Supabase
      const { data: supabaseRequests, error } = await supabase.from("worker_requests")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error loading requests from Supabase:", error);
        toast.error("Error loading worker requests");
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
        duration: req.duration,
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
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load worker requests");
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success("Data refreshed successfully");
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
          
          // First update the worker_requests table with the assigned worker
          const { error: updateRequestError } = await supabase
            .from("worker_requests")
            .update({ 
              assigned_worker_id: workerId,
              assigned_worker_name: getWorkerName(workerId).split(' (')[0],
              status: "assigned" 
            })
            .eq("id", requestId);
            
          if (updateRequestError) {
            console.error("Error updating request:", updateRequestError);
            return false;
          }
          
          // Update the workers table with assigned business
          const { error: workerUpdateError } = await supabase
            .from("workers")
            .update({
              assignedBusinessId: businessId,
              status: "active", // Ensure worker status is active
              updated_at: new Date().toISOString()
            })
            .eq("id", workerId);
            
          if (workerUpdateError) {
            console.error("Error updating worker record:", workerUpdateError);
            // Continue despite error to try notification creation
          }
          
          // Create assignment notification for the worker with improved details
          const workerNotification = {
            worker_id: workerId,
            job_id: requestId, // Include the job ID for reference
            type: 'assignment',
            message: `You have been assigned to work for ${request.businessName || request.business_name}. ${request.description ? `Job description: ${request.description}` : ''}`,
            status: 'unread',
            created_at: new Date().toISOString(),
            action_required: true,
            action_type: 'accept_decline',
            title: `New Assignment: ${request.businessName || request.business_name}`,
            business_id: businessId,
            duration: request.duration || "Not specified"
          };
          
          const { error: workerNotificationError } = await supabase
            .from('worker_notifications')
            .insert(workerNotification);
            
          if (workerNotificationError) {
            console.error("Error creating worker notification:", workerNotificationError);
            toast.error("Failed to send notification to worker");
            return false;
          } else {
            console.log("Worker notification created successfully");
          }
          
          // Create a more detailed worker assignment record
          const assignmentData = {
            worker_id: workerId,
            business_id: businessId,
            business_name: request.businessName || request.business_name,
            status: 'pending',
            job_description: request.description || "No description provided",
            skill_required: request.requiredSkills || request.skill || "Not specified",
            created_at: new Date().toISOString(),
            location: "Job site", // Default location
            duration: request.duration || "As needed" // Fixed: Use the request.duration if available, otherwise default to "As needed"
          };
          
          const { error: assignmentError } = await supabase
            .from('worker_assignments')
            .insert(assignmentData);
            
          if (assignmentError) {
            console.error("Error creating worker assignment:", assignmentError);
          } else {
            console.log("Worker assignment created successfully");
          }
          
          // Create notification for the business
          const businessNotification = {
            business_id: businessId,
            type: 'worker_assigned',
            message: `Worker ${getWorkerName(workerId).split(' (')[0]} has been assigned to your request`,
            worker_id: workerId,
            worker_name: getWorkerName(workerId).split(' (')[0],
            read: false,
            created_at: new Date().toISOString()
          };
          
          const { error: businessNotificationError } = await supabase
            .from('business_notifications')
            .insert(businessNotification);
            
          if (businessNotificationError) {
            console.error("Error creating business notification:", businessNotificationError);
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
        
        // Update local storage
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

  // Improved worker skill matching function with more flexible matching
  const workerMatchesSkill = (worker: Worker, requiredSkill: string) => {
    if (!requiredSkill || requiredSkill.trim() === "") return true;
    if (!worker.skill) return false;
    
    // Get worker's skill and normalize it
    const workerSkill = worker.skill.toLowerCase().trim();
    // Get required skill and normalize it
    const required = requiredSkill.toLowerCase().trim();
    
    // Define common skill categories and their related terms
    const skillCategories = {
      agriculture: ['farm', 'agricult', 'crop', 'harvest', 'plant', 'garden'],
      construction: ['build', 'construct', 'carpent', 'masonry', 'plumb', 'electr', 'paint'],
      hospitality: ['hotel', 'accommod', 'host', 'restaurant', 'cater', 'food', 'cook', 'chef'],
      cleaning: ['clean', 'janitor', 'housekeep', 'sanit'],
      healthcare: ['care', 'health', 'nurse', 'medical', 'patient'],
      manufacturing: ['factory', 'produc', 'assembl', 'manufactur'],
      driving: ['drive', 'transport', 'deliver', 'logistics', 'truck', 'vehicle'],
      retail: ['shop', 'store', 'retail', 'sales', 'cashier', 'customer'],
      general: ['labor', 'manual', 'helper', 'assist', 'general']
    };
    
    // Look for exact matches first
    if (workerSkill === required) return true;
    
    // Look for partial matches
    if (workerSkill.includes(required) || required.includes(workerSkill)) return true;
    
    // Look for matches within skill categories
    for (const [category, terms] of Object.entries(skillCategories)) {
      const workerHasCategory = terms.some(term => workerSkill.includes(term));
      const jobRequiresCategory = terms.some(term => required.includes(term));
      
      if (workerHasCategory && jobRequiresCategory) return true;
    }
    
    return false;
  };

  // Filter workers based on search term
  const filteredAvailableWorkers = (requiredSkill: string) => {
    const availableWorkers = getAvailableWorkers();
    return availableWorkers.filter(worker => 
      worker.status === "active" && 
      workerMatchesSkill(worker, requiredSkill) &&
      (searchTerm === "" || 
       worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (worker.skill && worker.skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
       (worker.phone && worker.phone.includes(searchTerm)))
    );
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
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xl md:text-2xl text-gradient-primary">Assign Workers to Approved Requests</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search workers by name or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
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
                  
                  // Filter workers based on the required skill and search term
                  const matchingWorkers = filteredAvailableWorkers(requiredSkill).filter(worker =>
                    !selectedWorkers[request.id]?.includes(worker.id)
                  );
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.businessName || request.business_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{requiredSkill || "Any skill"}</Badge>
                      </TableCell>
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
                                  {worker.name} ({worker.skill || "No skill"})
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