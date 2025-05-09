
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkers } from "@/hooks/useWorkers";
import { MigrantWorker } from "@/types/worker";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";

interface AssignWorkersTabProps {
  businessId?: string;
  currentWorkers?: MigrantWorker[];
}

export function AssignWorkersTab({ businessId, currentWorkers = [] }: AssignWorkersTabProps) {
  const { workers, isLoadingWorkers } = useWorkers();
  const [searchTerm, setSearchTerm] = useState("");
  const [assignedWorkers, setAssignedWorkers] = useState<MigrantWorker[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch workers assigned to this business
  useEffect(() => {
    const loadAssignedWorkers = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const businessId = currentUser.id;
        
        if (!businessId) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from("workers")
          .select("*")
          .eq("assignedBusinessId", businessId);
          
        if (error) {
          console.error("Error loading assigned workers:", error);
        } else {
          console.log("Assigned workers loaded:", data);
          setAssignedWorkers(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAssignedWorkers();
  }, []);
  
  // Ensure workers is properly typed as MigrantWorker[]
  const typedWorkers = workers as MigrantWorker[];
  
  // Filter workers that are not already assigned to this business
  const availableWorkers = typedWorkers.filter(
    worker => 
      !assignedWorkers.some(cw => cw.id === worker.id) && 
      worker.status === "active"
  );
  
  const filteredWorkers = searchTerm 
    ? availableWorkers.filter(
        worker => 
          worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (worker.skill || worker.primarySkill || worker["Primary Skill"] || "")
            .toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableWorkers;
  
  const handleAssignWorker = async (worker: MigrantWorker) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const businessId = currentUser.id;
      
      if (!businessId) {
        toast.error("Business ID not found");
        return;
      }
      
      // Create a request
      const { data, error } = await supabase
        .from("worker_requests")
        .insert([
          {
            business_id: businessId,
            business_name: currentUser.name || "Business",
            workers_needed: 1,
            skill: worker.skill || worker.primarySkill || worker["Primary Skill"] || "",
            description: `Request for worker: ${worker.name}`,
            status: "pending",
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      toast.success(`Request for worker ${worker.name} has been submitted for approval`);
    } catch (error: any) {
      console.error("Error submitting worker request:", error);
      toast.error(`Failed to request worker: ${error.message}`);
    }
  };
  
  if (loading || isLoadingWorkers) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <LoadingSpinner text="Loading workers..." />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign Workers</CardTitle>
          <CardDescription>
            Find available workers and request them for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by name or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((worker) => (
                    <TableRow key={worker.id} className="hover:bg-accent/30">
                      <TableCell className="font-medium">{worker.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10">
                          {worker.skill || worker.primarySkill || worker["Primary Skill"] || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{worker.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={worker.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {worker.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          onClick={() => handleAssignWorker(worker)} 
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                        >
                          Request
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No available workers found matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {assignedWorkers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Workers Currently Assigned to Your Business</h3>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Skill</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedWorkers.map((worker) => (
                      <TableRow key={worker.id} className="bg-accent/10">
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{worker.primarySkill || worker.skill || worker["Primary Skill"] || "General"}</TableCell>
                        <TableCell className="hidden md:table-cell">{worker.phone}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">
                            Assigned
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
