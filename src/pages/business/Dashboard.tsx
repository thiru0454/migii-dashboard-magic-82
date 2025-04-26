import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { WorkerRequestForm } from "@/components/worker/WorkerRequestForm";
import { BusinessRequestsTab } from "@/components/business/BusinessRequestsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BusinessDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Business Dashboard</h1>
        
        <Tabs defaultValue="submit-request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit-request">Submit Request</TabsTrigger>
            <TabsTrigger value="view-requests">View Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="submit-request">
            <DashboardCard title="Submit Worker Request">
              <WorkerRequestForm />
            </DashboardCard>
          </TabsContent>
          
          <TabsContent value="view-requests">
            <DashboardCard title="Your Requests">
              <BusinessRequestsTab />
            </DashboardCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 