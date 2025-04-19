import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MoreVertical, FileText, Edit, Phone, MessageSquare, Loader2 } from "lucide-react";

export type Worker = {
  id: string;
  name: string;
  age: number;
  phone: string;
  originState: string;
  skill: string;
  status: "active" | "inactive" | "pending";
  photoUrl?: string;
  registrationDate: string;
};

interface WorkersTableProps {
  data: Worker[];
  onViewDetails: (worker: Worker) => void;
}

export const WorkersTable = ({ data, onViewDetails }: WorkersTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSkill, setFilterSkill] = useState<string>("all-skills");
  const [filterState, setFilterState] = useState<string>("all-states");

  // Get unique skills and states for filters
  const uniqueSkills = Array.from(new Set(data.map((worker) => worker.skill)));
  const uniqueStates = Array.from(new Set(data.map((worker) => worker.originState)));

  // Filter workers based on search and filters
  const filteredWorkers = data.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.phone.includes(searchTerm);

    const matchesSkill = filterSkill === "all-skills" ? true : worker.skill === filterSkill;
    const matchesState = filterState === "all-states" ? true : worker.originState === filterState;

    return matchesSearch && matchesSkill && matchesState;
  });

  // Function to render status badge
  const renderStatusBadge = (status: Worker["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return null;
    }
  };

  // Function to clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterSkill("all-skills");
    setFilterState("all-states");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-1 gap-2">
          <Select value={filterSkill} onValueChange={setFilterSkill}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-skills">All Skills</SelectItem>
              {uniqueSkills.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-states">All States</SelectItem>
              {uniqueStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(filterSkill !== "all-skills" || filterState !== "all-states" || searchTerm) && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Skill</TableHead>
              <TableHead>Origin State</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span>Loading workers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredWorkers.length > 0 ? (
              filteredWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={worker.photoUrl} alt={worker.name} />
                        <AvatarFallback className="bg-migii-muted text-migii-dark text-xs">
                          {worker.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{worker.name}</span>
                        <span className="text-xs text-muted-foreground">{worker.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{worker.id}</TableCell>
                  <TableCell>{worker.skill}</TableCell>
                  <TableCell>{worker.originState}</TableCell>
                  <TableCell>{renderStatusBadge(worker.status)}</TableCell>
                  <TableCell>{worker.registrationDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onViewDetails?.(worker)}
                          className="cursor-pointer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Worker
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Phone className="mr-2 h-4 w-4" />
                          Call Worker
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No workers found matching your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
