
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkersTable, Worker } from "@/components/admin/WorkersTable";
import { WorkerDetailsDialog } from "./WorkerDetailsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWorkers } from "@/hooks/useWorkers";
import { Search, Filter, UserPlus, Download } from "lucide-react";

export function WorkersTab() {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [workerDetailsOpen, setWorkerDetailsOpen] = useState(false);
  const { workers, isLoadingWorkers } = useWorkers();
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  // Get unique skills and states for filter dropdowns
  const uniqueSkills = Array.from(new Set(workers.map(worker => worker.skill)));
  const uniqueStates = Array.from(new Set(workers.map(worker => worker.originState)));

  // Apply filters
  useEffect(() => {
    let results = [...workers];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        worker =>
          worker.name.toLowerCase().includes(term) ||
          worker.id.toLowerCase().includes(term) ||
          worker.phone.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      results = results.filter(worker => worker.status === statusFilter);
    }
    
    // Apply skill filter
    if (skillFilter !== "all") {
      results = results.filter(worker => worker.skill === skillFilter);
    }
    
    // Apply state filter
    if (stateFilter !== "all") {
      results = results.filter(worker => worker.originState === stateFilter);
    }
    
    setFilteredWorkers(results);
  }, [workers, searchTerm, statusFilter, skillFilter, stateFilter]);

  const handleViewWorkerDetails = (worker: Worker) => {
    setSelectedWorker(worker);
    setWorkerDetailsOpen(true);
  };

  const handleExportData = () => {
    // Create CSV from filtered workers
    let csv = 'ID,Name,Age,Phone,Origin State,Skill,Status,Registration Date\n';
    filteredWorkers.forEach(worker => {
      csv += `${worker.id},${worker.name},${worker.age},"${worker.phone}",${worker.originState},${worker.skill},${worker.status},${worker.registrationDate}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'workers-export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Show success message
    toast.success(`Exported ${filteredWorkers.length} worker records`);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Worker Database</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredWorkers.length} of {workers.length} workers
            </span>
            <Button variant="outline" size="sm" asChild>
              <a href="/worker-registration">
                <UserPlus className="h-4 w-4 mr-1" />
                Register
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID or phone..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {uniqueSkills.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Origin State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredWorkers.length > 0 ? (
            <WorkersTable 
              workers={filteredWorkers} 
              onViewDetails={handleViewWorkerDetails}
              isLoading={isLoadingWorkers}
            />
          ) : (
            <div className="text-center py-10 border rounded-md">
              <p className="text-muted-foreground">No workers match your filters</p>
              {(searchTerm || statusFilter !== "all" || skillFilter !== "all" || stateFilter !== "all") && (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setSkillFilter("all");
                    setStateFilter("all");
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <WorkerDetailsDialog
        worker={selectedWorker}
        open={workerDetailsOpen}
        onOpenChange={setWorkerDetailsOpen}
      />
    </>
  );
}
