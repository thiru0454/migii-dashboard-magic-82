
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { WorkerRequestForm } from "@/components/worker/WorkerRequestForm";
import { BusinessRequestsTab } from "@/components/business/BusinessRequestsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessUserDetails } from "@/components/business/BusinessUserDetails";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase, getAllWorkers } from "@/utils/supabaseClient";
import { JobsTab } from "@/components/business/JobsTab";
import { JobNotificationsTab } from "@/components/business/JobNotificationsTab";
import { AssignWorkersTab } from "@/components/business/AssignWorkersTab";
import { SKILLS } from "@/constants/skills";
import { AlertCircle, BookOpen } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState("business-details");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [pendingRequestsCount, setpendingRequestsCount] = useState(0);
  const [form, setForm] = useState({
    workersNeeded: 1,
    skill: "",
    priority: "Normal",
    duration: "",
    description: ""
  });
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      // Fetch from Supabase using email
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("email", currentUser.email)
        .single();
      setBusiness(data);
    };
    fetchBusiness();
    
    // Get count of pending requests
    fetchRequestCounts();
    
    // Set up real-time subscription for worker requests
    const channel = supabase
      .channel('business_dashboard_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_requests',
        },
        () => {
          fetchRequestCounts();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchRequestCounts = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      
      // Count requests with assigned workers
      const { data: assignedData, error: assignedError } = await supabase
        .from("worker_requests")
        .select("id", { count: 'exact' })
        .eq("business_id", currentUser.id)
        .eq("status", "assigned");
        
      if (!assignedError && assignedData) {
        setNotificationCount(assignedData.length);
      }
      
      // Count pending requests
      const { data: pendingData, error: pendingError } = await supabase
        .from("worker_requests")
        .select("id", { count: 'exact' })
        .eq("business_id", currentUser.id)
        .eq("status", "pending");
        
      if (!pendingError && pendingData) {
        setpendingRequestsCount(pendingData.length);
      }
    } catch (error) {
      console.error("Error fetching request counts:", error);
    }
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!business || !business.id) {
      toast.error("Business not loaded. Please wait and try again.");
      return;
    }
    setConfirmOpen(false);
    setDialogOpen(false);
    // Save to Supabase
    const { data: request, error } = await supabase.from("worker_requests").insert([
      {
        business_id: business.id,
        business_name: business.name,
        workers_needed: form.workersNeeded,
        skill: form.skill,
        priority: form.priority,
        duration: form.duration,
        description: form.description,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ]).select().single();
    if (error) {
      toast.error("Failed to submit request: " + error.message);
      return;
    }
    
    toast.success("Worker request submitted successfully!");
    
    // Reset the form
    setForm({
      workersNeeded: 1,
      skill: "",
      priority: "Normal",
      duration: "",
      description: ""
    });
    
    // Refresh counts
    fetchRequestCounts();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gradient-primary">Business Dashboard</h1>
        
        {notificationCount > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800">New Worker Assignment</AlertTitle>
            <AlertDescription className="text-blue-700">
              You have {notificationCount} new worker{notificationCount !== 1 && 's'} assigned to your request{notificationCount !== 1 && 's'}.
              <Button 
                variant="link" 
                onClick={() => setActiveTab("view-requests")}
                className="text-blue-600 p-0 h-auto font-semibold"
              >
                View details
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {pendingRequestsCount > 0 && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <BookOpen className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Pending Worker Requests</AlertTitle>
            <AlertDescription className="text-yellow-700">
              You have {pendingRequestsCount} pending worker request{pendingRequestsCount !== 1 && 's'} awaiting review.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-full grid-cols-5 sm:grid-cols-5 md:w-auto inline-flex">
              <TabsTrigger value="business-details">Business Details</TabsTrigger>
              <TabsTrigger value="worker-request" className="relative">
                Worker Request
                {pendingRequestsCount > 0 && (
                  <Badge className="ml-1 bg-yellow-500 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full absolute -top-1 -right-1">
                    {pendingRequestsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="view-requests" className="relative">
                View Requests
                {notificationCount > 0 && (
                  <Badge className="ml-1 bg-blue-500 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full absolute -top-1 -right-1">
                    {notificationCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="jobs">Post Jobs</TabsTrigger>
              <TabsTrigger value="job-notifications">Job Notifications</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="business-details">
            <DashboardCard title="Business Details">
              {business ? (
                <BusinessUserDetails business={business} onEdit={() => {}} />
              ) : (
                <div>No business details found.</div>
              )}
            </DashboardCard>
          </TabsContent>

          <TabsContent value="worker-request">
            <DashboardCard title="Worker Request">
              <Button onClick={() => setDialogOpen(true)} className="mb-4 bg-primary hover:bg-primary/90" disabled={!business}>
                Request Worker
              </Button>
              <Dialog open={dialogOpen && !!business} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Request Worker</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Number of Workers Needed</label>
                        <Input type="number" name="workersNeeded" min={1} value={form.workersNeeded} onChange={handleChange} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Required Skill</label>
                        <Select value={form.skill} onValueChange={v => handleSelect("skill", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select skill" />
                          </SelectTrigger>
                          <SelectContent>
                            {SKILLS.map(skill => (
                              <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Priority Level</label>
                        <Select value={form.priority} onValueChange={v => handleSelect("priority", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Estimated Duration</label>
                        <Input type="text" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g., 2 days, 1 week" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description (optional)</label>
                      <Input type="text" name="description" value={form.description} onChange={handleChange} />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-primary hover:bg-primary/90">Submit Request</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              {/* Confirmation Dialog */}
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Confirm Submission</DialogTitle>
                  </DialogHeader>
                  <div>Do you want to submit this request?</div>
                  <DialogFooter>
                    <Button onClick={handleConfirm} className="bg-primary hover:bg-primary/90">OK</Button>
                    <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DashboardCard>
          </TabsContent>

          <TabsContent value="view-requests">
            <DashboardCard title="Your Requests">
              <BusinessRequestsTab />
            </DashboardCard>
          </TabsContent>

          <TabsContent value="jobs">
            <DashboardCard title="Post Jobs">
              <JobsTab />
            </DashboardCard>
          </TabsContent>

          <TabsContent value="job-notifications">
            <DashboardCard title="Job Notifications">
              <JobNotificationsTab />
            </DashboardCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
