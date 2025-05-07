
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
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8 gap-1 overflow-x-auto">
          <TabsTrigger value="dashboard" className="text-sm md:text-base">Dashboard</TabsTrigger>
          <TabsTrigger value="id-card" className="text-sm md:text-base">ID Card</TabsTrigger>
          <TabsTrigger value="requests" className="text-sm md:text-base">Assigned Work</TabsTrigger>
          <TabsTrigger value="jobs" className="text-sm md:text-base animate-pulse">Available Jobs</TabsTrigger>
          <TabsTrigger value="support" className="text-sm md:text-base">Support</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="animate-fade-in">
          <WorkerDashboardTab workerData={workerData} />
        </TabsContent>
        
        <TabsContent value="id-card" className="pt-6 flex justify-center animate-fade-in">
          <WorkerIDCard
            workerId={workerData.workerId}
            name={workerData.name}
            phone={workerData.phone}
            skill={workerData.skill}
            originState={workerData.originState}
          />
        </TabsContent>
        
        <TabsContent value="requests" className="animate-fade-in">
          <WorkerRequestsList />
        </TabsContent>
        
        <TabsContent value="jobs" className="animate-fade-in">
          <AvailableJobsTab />
        </TabsContent>
        
        <TabsContent value="support" className="animate-fade-in">
          <WorkerSupportTab supportHistory={workerData.supportHistory} />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={onSignOut}
          className="hover:bg-primary/10 transition-all duration-300"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
