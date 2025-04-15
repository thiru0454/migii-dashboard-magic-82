
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkersTable, Worker } from "@/components/admin/WorkersTable";
import { HelpRequestsList, HelpRequest } from "@/components/admin/HelpRequestsList";
import { WorkerIDCard } from "@/components/worker/WorkerIDCard";
import { mockWorkers, mockHelpRequests } from "@/data/mockData";
import { Search, Download, Users, MessageSquare, Filter } from "lucide-react";

const AdminDashboard = () => {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [activeTab, setActiveTab] = useState("workers");
  const [searchTerm, setSearchTerm] = useState("");
  const [workerDetailsOpen, setWorkerDetailsOpen] = useState(false);
  
  // Handle worker details view
  const handleViewWorkerDetails = (worker: Worker) => {
    setSelectedWorker(worker);
    setWorkerDetailsOpen(true);
  };

  // Handle request status change
  const handleRequestStatusChange = (requestId: string, newStatus: HelpRequest["status"]) => {
    // In a real app, this would update the status in the database
    console.log(`Request ${requestId} status changed to ${newStatus}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage workers and handle support requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        <Tabs defaultValue="workers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="workers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Worker Database</span>
              <span className="sm:hidden">Workers</span>
            </TabsTrigger>
            <TabsTrigger value="help-requests" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Help Requests</span>
              <span className="sm:hidden">Help</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="workers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl">Worker Database</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {mockWorkers.length} workers
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <WorkersTable 
                  workers={mockWorkers} 
                  onViewDetails={handleViewWorkerDetails} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="help-requests" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl">Help Requests</CardTitle>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All requests</SelectItem>
                      <SelectItem value="pending">Pending only</SelectItem>
                      <SelectItem value="processing">In progress only</SelectItem>
                      <SelectItem value="resolved">Resolved only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <HelpRequestsList 
                  requests={mockHelpRequests} 
                  onStatusChange={handleRequestStatusChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Worker Details Dialog */}
      <Dialog open={workerDetailsOpen} onOpenChange={setWorkerDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Worker Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected worker
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorker && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedWorker.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-medium">{selectedWorker.age}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedWorker.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Skill</p>
                      <p className="font-medium">{selectedWorker.skill}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Origin State</p>
                      <p className="font-medium">{selectedWorker.originState}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Date</p>
                      <p className="font-medium">{selectedWorker.registrationDate}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Support History</h3>
                  <div className="border rounded-md mt-2">
                    {mockHelpRequests.filter(req => req.workerId === selectedWorker.id).length > 0 ? (
                      <div className="divide-y">
                        {mockHelpRequests
                          .filter(req => req.workerId === selectedWorker.id)
                          .map((req) => (
                            <div key={req.id} className="p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium">{req.requestDate}</p>
                                  <p className="text-sm text-muted-foreground">{req.message}</p>
                                </div>
                                <div className="text-xs font-medium">
                                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No support history found
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button>Update Details</Button>
                  <Button variant="outline">Send Message</Button>
                </div>
              </div>
              
              <div>
                <WorkerIDCard
                  workerId={selectedWorker.id}
                  name={selectedWorker.name}
                  phone={selectedWorker.phone}
                  skill={selectedWorker.skill}
                  originState={selectedWorker.originState}
                  photoUrl={selectedWorker.photoUrl}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDashboard;
