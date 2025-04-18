
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkersTable, Worker } from "@/components/admin/WorkersTable";
import { WorkerDetailsDialog } from "./WorkerDetailsDialog";
import { useState } from "react";
import { useWorkers } from "@/hooks/useWorkers";

export function WorkersTab() {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [workerDetailsOpen, setWorkerDetailsOpen] = useState(false);
  const { workers, isLoadingWorkers } = useWorkers();

  const handleViewWorkerDetails = (worker: Worker) => {
    setSelectedWorker(worker);
    setWorkerDetailsOpen(true);
  };

  return (
    <>
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

      <WorkerDetailsDialog
        worker={selectedWorker}
        open={workerDetailsOpen}
        onOpenChange={setWorkerDetailsOpen}
      />
    </>
  );
}
