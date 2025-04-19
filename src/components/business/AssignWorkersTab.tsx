
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { MigrantWorker } from "@/types/worker";
import { useWorkers } from "@/hooks/useWorkers";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, Search } from "lucide-react";
import { toast } from "sonner";

interface AssignWorkersTabProps {
  businessId?: string;
  currentWorkers: MigrantWorker[];
}

export function AssignWorkersTab({ businessId, currentWorkers }: AssignWorkersTabProps) {
  const { workers } = useWorkers();
  const [availableWorkers, setAvailableWorkers] = useState<MigrantWorker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredWorkers, setFilteredWorkers] = useState<MigrantWorker[]>([]);

  useEffect(() => {
    // Get workers not already assigned to this business
    const currentWorkerIds = new Set(currentWorkers.map(worker => worker.id));
    const available = (workers as MigrantWorker[]).filter(worker => !currentWorkerIds.has(worker.id));
    setAvailableWorkers(available);
    setFilteredWorkers(available);
  }, [workers, currentWorkers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setFilteredWorkers(availableWorkers);
      return;
    }
    
    const filtered = availableWorkers.filter(worker => 
      worker.name.toLowerCase().includes(query) ||
      worker.id.toLowerCase().includes(query) ||
      worker.skill.toLowerCase().includes(query) ||
      worker.originState.toLowerCase().includes(query)
    );
    
    setFilteredWorkers(filtered);
  };

  const handleAssignWorker = (worker: MigrantWorker) => {
    // In a real app, this would make an API call to update the database
    toast.success(`Worker ${worker.name} assigned to your business!`);
    
    // Remove from available workers
    setAvailableWorkers(prev => prev.filter(w => w.id !== worker.id));
    setFilteredWorkers(prev => prev.filter(w => w.id !== worker.id));
  };

  const handleRemoveWorker = (worker: MigrantWorker) => {
    // In a real app, this would make an API call to update the database
    toast.success(`Worker ${worker.name} removed from your business!`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Currently Assigned Workers</CardTitle>
        </CardHeader>
        <CardContent>
          {currentWorkers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No workers currently assigned to your business.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.id}</TableCell>
                    <TableCell>{worker.name}</TableCell>
                    <TableCell>{worker.skill}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Assigned
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveWorker(worker)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">Available Workers</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workers..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No workers match your search." : "No available workers."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Origin State</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.id}</TableCell>
                    <TableCell>{worker.name}</TableCell>
                    <TableCell>{worker.skill}</TableCell>
                    <TableCell>{worker.originState}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAssignWorker(worker)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
