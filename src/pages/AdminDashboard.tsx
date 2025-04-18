import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { WorkersTable, Worker } from "@/components/admin/WorkersTable";
import { BusinessUsersTable } from "@/components/admin/BusinessUsersTable";
import { HelpRequestsList, HelpRequest } from "@/components/admin/HelpRequestsList";
import { WorkerIDCard } from "@/components/worker/WorkerIDCard";
import { mockHelpRequests } from "@/data/mockData";
import { useWorkers } from "@/hooks/useWorkers";
import { Download, Users, MessageSquare, Filter, Building } from "lucide-react";
import { BusinessUser, getAllBusinessUsers, deleteBusinessUser } from "@/utils/businessDatabase";
import { useAppAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const AdminDashboard = () => {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [activeTab, setActiveTab] = useState("workers");
  const [workerDetailsOpen, setWorkerDetailsOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState("all");
  const { workers, isLoadingWorkers } = useWorkers();
  const { logout } = useAppAuth();
  
  // Business users state
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessUser | null>(null);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  const [businessDialogMode, setBusinessDialogMode] = useState<"view" | "edit" | "add">("view");
  
  // Load business users
  useEffect(() => {
    setBusinessUsers(getAllBusinessUsers());
  }, []);
  
  // Business form schema
  const businessSchema = z.object({
    businessId: z.string().min(3, "Business ID must be at least 3 characters"),
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    status: z.enum(["active", "inactive", "suspended"]),
  });
  
  // Business form
  const businessForm = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessId: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      status: "active",
    },
  });
  
  // Set form values when editing a business
  useEffect(() => {
    if (selectedBusiness && businessDialogMode === "edit") {
      businessForm.reset({
        businessId: selectedBusiness.businessId,
        name: selectedBusiness.name,
        email: selectedBusiness.email,
        phone: selectedBusiness.phone,
        password: selectedBusiness.password,
        status: selectedBusiness.status,
      });
    } else if (businessDialogMode === "add") {
      businessForm.reset({
        businessId: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        status: "active",
      });
    }
  }, [selectedBusiness, businessDialogMode]);
  
  // Handle business form submit
  const onBusinessFormSubmit = (values: z.infer<typeof businessSchema>) => {
    // In a real app, this would update the database
    // For now, we'll update the localStorage
    try {
      if (businessDialogMode === "add") {
        // Add new business
        const newBusinessUser = {
          registrationDate: new Date().toISOString(),
          status: values.status || "active", // Ensure status is always set
          ...values
        };
        
        // This would be handled by the database in a real app
        const users = getAllBusinessUsers();
        const newId = `b${users.length + 1}`;
        const businessWithId = { ...newBusinessUser, id: newId };
        
        setBusinessUsers([...users, businessWithId]);
        localStorage.setItem("businessUsers", JSON.stringify([...users, businessWithId]));
        
        toast.success("Business user added successfully");
      } else if (businessDialogMode === "edit" && selectedBusiness) {
        // Update existing business
        const users = getAllBusinessUsers();
        const updatedUsers = users.map(user => 
          user.id === selectedBusiness.id ? { ...user, ...values } : user
        );
        
        setBusinessUsers(updatedUsers);
        localStorage.setItem("businessUsers", JSON.stringify(updatedUsers));
        
        toast.success("Business user updated successfully");
      }
      
      setBusinessDialogOpen(false);
    } catch (error) {
      toast.error("An error occurred", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
  
  // Handle business delete
  const handleDeleteBusiness = (business: BusinessUser) => {
    if (confirm(`Are you sure you want to delete ${business.name}?`)) {
      try {
        deleteBusinessUser(business.id);
        setBusinessUsers(getAllBusinessUsers());
        toast.success("Business user deleted successfully");
      } catch (error) {
        toast.error("Failed to delete business user");
      }
    }
  };
  
  // Handle worker details view
  const handleViewWorkerDetails = (worker: Worker) => {
    setSelectedWorker(worker);
    setWorkerDetailsOpen(true);
  };

  // Handle business details view
  const handleViewBusinessDetails = (business: BusinessUser) => {
    setSelectedBusiness(business);
    setBusinessDialogMode("view");
    setBusinessDialogOpen(true);
  };
  
  // Handle business edit
  const handleEditBusiness = (business: BusinessUser) => {
    setSelectedBusiness(business);
    setBusinessDialogMode("edit");
    setBusinessDialogOpen(true);
  };
  
  // Handle add new business
  const handleAddBusiness = () => {
    setSelectedBusiness(null);
    setBusinessDialogMode("add");
    setBusinessDialogOpen(true);
  };

  // Handle request status change
  const handleRequestStatusChange = (requestId: string, newStatus: HelpRequest["status"]) => {
    // In a real app, this would update the status in the database
    console.log(`Request ${requestId} status changed to ${newStatus}`);
  };

  // Handle admin logout
  const handleLogout = () => {
    logout();
  };

  // Filter help requests based on status
  const filteredRequests = requestFilter === "all" 
    ? mockHelpRequests 
    : mockHelpRequests.filter(req => req.status === requestFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage workers, businesses and handle support requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
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
            <TabsTrigger value="businesses" className="gap-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Business Users</span>
              <span className="sm:hidden">Businesses</span>
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
                    {workers.length} workers
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <WorkersTable 
                  workers={workers} 
                  onViewDetails={handleViewWorkerDetails}
                  isLoading={isLoadingWorkers}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="businesses" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl">Business Users</CardTitle>
                <Button onClick={handleAddBusiness}>Add Business</Button>
              </CardHeader>
              <CardContent>
                <BusinessUsersTable 
                  businesses={businessUsers}
                  onViewDetails={handleViewBusinessDetails}
                  onEdit={handleEditBusiness}
                  onDelete={handleDeleteBusiness}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="help-requests" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl">Help Requests</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={requestFilter} onValueChange={setRequestFilter}>
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
                  requests={filteredRequests} 
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

      {/* Business Details/Edit Dialog */}
      <Dialog open={businessDialogOpen} onOpenChange={setBusinessDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {businessDialogMode === "view" 
                ? "Business Details" 
                : businessDialogMode === "edit" 
                  ? "Edit Business" 
                  : "Add Business"}
            </DialogTitle>
            <DialogDescription>
              {businessDialogMode === "view" 
                ? "View business information" 
                : businessDialogMode === "edit" 
                  ? "Make changes to business information" 
                  : "Add a new business user"}
            </DialogDescription>
          </DialogHeader>
          
          {businessDialogMode === "view" && selectedBusiness ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Business ID</Label>
                <div className="font-medium">{selectedBusiness.businessId}</div>
              </div>
              <div className="space-y-1">
                <Label>Registration Date</Label>
                <div className="font-medium">{new Date(selectedBusiness.registrationDate).toLocaleDateString()}</div>
              </div>
              <div className="space-y-1">
                <Label>Name</Label>
                <div className="font-medium">{selectedBusiness.name}</div>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <div className="font-medium">{selectedBusiness.email}</div>
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <div className="font-medium">{selectedBusiness.phone}</div>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <div className="font-medium">{selectedBusiness.status}</div>
              </div>
              <div className="md:col-span-2 pt-4">
                <Button onClick={() => {
                  setBusinessDialogMode("edit");
                }}>Edit Business</Button>
              </div>
            </div>
          ) : (
            <Form {...businessForm}>
              <form onSubmit={businessForm.handleSubmit(onBusinessFormSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={businessForm.control}
                    name="businessId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business ID</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly={businessDialogMode === "edit"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={businessForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">
                    {businessDialogMode === "add" ? "Add Business" : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDashboard;
