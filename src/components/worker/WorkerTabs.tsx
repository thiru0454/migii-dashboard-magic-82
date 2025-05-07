
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WorkerDashboardTab } from "./WorkerDashboardTab";
import { WorkerSupportTab } from "./WorkerSupportTab";
import { WorkerIDCard } from "@/components/worker/WorkerIDCard";
import { WorkerRequestsList } from "@/components/worker/WorkerRequestsList";
import { AvailableJobsTab } from "@/components/worker/AvailableJobsTab";

interface WorkerData {
  workerId: string;
  name: string;
  phone: string;
  skill: string;
  originState: string;
  status: string;
  supportHistory: {
    id: string;
    date: string;
    issue: string;
    status: string;
  }[];
}

interface WorkerTabsProps {
  workerData: WorkerData;
  onSignOut: () => void;
}

export function WorkerTabs({ workerData, onSignOut }: WorkerTabsProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="id-card">ID Card</TabsTrigger>
          <TabsTrigger value="requests">Assigned Work</TabsTrigger>
          <TabsTrigger value="jobs" className="animate-pulse">Available Jobs</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <WorkerDashboardTab workerData={workerData} />
        </TabsContent>
        
        <TabsContent value="id-card" className="pt-6 flex justify-center">
          <WorkerIDCard
            workerId={workerData.workerId}
            name={workerData.name}
            phone={workerData.phone}
            skill={workerData.skill}
            originState={workerData.originState}
          />
        </TabsContent>
        
        <TabsContent value="requests">
          <WorkerRequestsList />
        </TabsContent>
        
        <TabsContent value="jobs" className="animate-fade-in">
          <AvailableJobsTab />
        </TabsContent>
        
        <TabsContent value="support">
          <WorkerSupportTab supportHistory={workerData.supportHistory} />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center">
        <Button variant="outline" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
