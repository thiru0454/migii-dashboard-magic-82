import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkerRegistrationForm } from "@/components/forms/WorkerRegistrationForm";
import { WorkerIDCard } from "@/components/worker/WorkerIDCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MigrantWorker } from "@/types/worker";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateWorkerIDCardPDF } from "@/utils/pdfUtils";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkersContext } from "@/contexts/WorkersContext";

interface WorkerRegistrationProps {
  // Add any props if needed
}

const WorkerRegistration: React.FC<WorkerRegistrationProps> = () => {
  const [registeredWorker, setRegisteredWorker] = useState<MigrantWorker | null>(null);
  const navigate = useNavigate();
  const { addWorker } = useWorkersContext();
  
  const handleRegistrationSuccess = (worker: MigrantWorker) => {
    // Ensure the worker object has the correct structure
    const formattedWorker = {
      ...worker,
      id: worker.id || `worker_${Date.now()}`,
      status: worker.status || "pending",
      skill: worker.skill || "", // Remove reference to skills array
      originState: worker.originState || "", // Remove reference to location
    };
    
    addWorker(formattedWorker);
    setRegisteredWorker(formattedWorker);
    
    toast.success("Worker Registration Successful!", {
      description: "Worker has been registered successfully. You can now download their ID card.",
      duration: 5000,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Worker Registration</h1>
          <p className="text-muted-foreground">
            Register new migrant workers in the system
          </p>
        </div>

        {registeredWorker ? (
          <div className="space-y-8">
            <Alert className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                <AlertDescription>
                  <p className="text-sm font-medium text-green-800">
                    Registration successful!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Worker has been registered with ID: {registeredWorker.id}
                  </p>
                </AlertDescription>
              </div>
            </Alert>

            <div className="space-y-6">
              <div id={`worker-card-${registeredWorker.id}`} className="worker-card-container">
                <WorkerIDCard
                  workerId={registeredWorker.id}
                  name={registeredWorker.name}
                  phone={registeredWorker.phone}
                  skill={registeredWorker.skill}
                  originState={registeredWorker.originState}
                  photoUrl={registeredWorker.photoUrl}
                />
              </div>

              <div className="flex flex-col items-center gap-6">
                <Button 
                  onClick={() => generateWorkerIDCardPDF(registeredWorker.id)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download ID Card
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => navigate("/worker-login")}
                >
                  Go to Worker Login
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <WorkerRegistrationForm onSuccess={handleRegistrationSuccess} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkerRegistration;
