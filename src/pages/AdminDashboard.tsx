<<<<<<< HEAD
=======

import { useState, useEffect } from "react";
>>>>>>> 7ced357b9f9b45b9bba7dffc1b78bfe5b0923c30
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { WorkersTab } from "@/components/admin/WorkersTab";
import { BusinessesTab } from "@/components/admin/BusinessesTab";
import { HelpRequestsTab } from "@/components/admin/HelpRequestsTab";
import { WorkersMap } from "@/components/admin/WorkersMap";
import { WorkerRequestsTab } from "@/components/admin/WorkerRequestsTab";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useWorkers } from "@/hooks/useWorkers";
import { useWorkerRequests } from "@/contexts/WorkerRequestsContext";
import { toast } from "sonner";
import { useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [tab, setTab] = useState("workers");
  const { workers } = useWorkers();
  const { requests, updateRequest } = useWorkerRequests();

<<<<<<< HEAD
  const handleUpdateRequest = (businessId: string, status: "approved" | "rejected") => {
    updateRequest(businessId, status);
    toast.success(`Request ${status} successfully!`);
=======
  // Load initial data
  useEffect(() => {
    loadWorkers();

    // Listen for worker status change events
    const handleWorkerStatusChange = (event: CustomEvent) => {
      const { workerId, status } = event.detail;
      handleStatusChange(workerId, status);
    };

    window.addEventListener('workerStatusChange', handleWorkerStatusChange as EventListener);
    return () => {
      window.removeEventListener('workerStatusChange', handleWorkerStatusChange as EventListener);
    };
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleWorkersUpdated = (event: CustomEvent) => {
      setWorkers(event.detail.workers);
    };

    window.addEventListener('workersUpdated', handleWorkersUpdated as EventListener);
    return () => {
      window.removeEventListener('workersUpdated', handleWorkersUpdated as EventListener);
    };
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const data = await getAllWorkers();
      setWorkers(data);
    } catch (error) {
      console.error('Error loading workers:', error);
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (workerId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      await updateWorkerStatus(workerId, newStatus);
      toast.success('Worker status updated successfully');
    } catch (error) {
      console.error('Error updating worker status:', error);
      toast.error('Failed to update worker status');
    }
>>>>>>> 7ced357b9f9b45b9bba7dffc1b78bfe5b0923c30
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <AdminDashboardHeader onLogout={logout} workers={workers} />
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="help">Help Requests</TabsTrigger>
          <TabsTrigger value="locations">Live Map</TabsTrigger>
          <TabsTrigger value="requests">Worker Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="workers">
          <div className="mt-4">
            <WorkersTab />
          </div>
        </TabsContent>
        <TabsContent value="businesses">
          <div className="mt-4">
            <BusinessesTab />
          </div>
        </TabsContent>
        <TabsContent value="help">
          <div className="mt-4">
            <HelpRequestsTab />
          </div>
        </TabsContent>
        <TabsContent value="locations">
          <div className="mt-6">
            <WorkersMap />
          </div>
        </TabsContent>
        <TabsContent value="requests">
          <div className="mt-4">
            <WorkerRequestsTab 
              requests={requests}
              onUpdateRequest={handleUpdateRequest}
            />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
