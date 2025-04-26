import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/tables/worker-columns";
import { MigrantWorker } from "@/types/worker";
import { getAllWorkers, updateWorkerStatus } from "@/services/workerService";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [workers, setWorkers] = useState<MigrantWorker[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadWorkers();
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
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage worker registrations and monitor system activity
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Workers</h3>
            </div>
            <div className="text-2xl font-bold">{workers.length}</div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Pending Approvals</h3>
            </div>
            <div className="text-2xl font-bold">
              {workers.filter(w => w.status === 'pending').length}
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Approved Workers</h3>
            </div>
            <div className="text-2xl font-bold">
              {workers.filter(w => w.status === 'approved').length}
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Rejected Workers</h3>
            </div>
            <div className="text-2xl font-bold">
              {workers.filter(w => w.status === 'rejected').length}
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <DataTable
            columns={columns}
            data={workers}
            loading={loading}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
