import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { WorkerDashboardTab } from "@/components/worker/WorkerDashboardTab";
import { AvailableJobsTab } from "@/components/worker/AvailableJobsTab";
import { JobNotificationsTab } from "@/components/worker/JobNotificationsTab";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getAllWorkers } from "@/utils/supabaseClient";

export default function WorkerDashboard() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [workerData, setWorkerData] = useState(location.state?.workerData);

  useEffect(() => {
    if (!workerData && currentUser && currentUser.userType === "worker") {
      getAllWorkers().then(({ data }) => {
        console.log("Current user:", currentUser);
        console.log("Fetched workers:", data);
        const worker = data.find(
          (w) =>
            (w.phone && w.phone.trim() === currentUser.phone.trim()) ||
            (w.email && w.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
            (w["Phone Number"] && w["Phone Number"].trim() === currentUser.phone.trim()) ||
            (w["Email Address"] && w["Email Address"].trim().toLowerCase() === currentUser.email.trim().toLowerCase())
        );
        console.log("Matched worker:", worker);
        setWorkerData(worker);
      });
    }
  }, [workerData, currentUser]);

  if (!workerData) {
    return <div className="text-center text-red-500">No worker data found.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="jobs">Available Jobs</TabsTrigger>
          <TabsTrigger value="notifications">Job Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <DashboardCard title="Profile">
            <WorkerDashboardTab workerData={workerData} />
          </DashboardCard>
        </TabsContent>

        <TabsContent value="jobs">
          <DashboardCard title="Available Jobs">
            <AvailableJobsTab />
          </DashboardCard>
        </TabsContent>

        <TabsContent value="notifications">
          <DashboardCard title="Job Notifications">
            <JobNotificationsTab />
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
} 