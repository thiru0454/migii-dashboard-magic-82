
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkerRegistrationForm } from "@/components/forms/WorkerRegistrationForm";
import { WorkerIDCard } from "@/components/worker/WorkerIDCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";

const formSchema = z.object({
  name: z.string(),
  age: z.number(),
  phone: z.string(),
  originState: z.string(),
  skill: z.string(),
  aadhaar: z.string().optional(),
  workerId: z.string(),
});

type FormData = z.infer<typeof formSchema>;

const WorkerRegistration = () => {
  const [registeredWorker, setRegisteredWorker] = useState<FormData | null>(null);
  
  const handleRegistrationSuccess = (data: FormData) => {
    setRegisteredWorker(data);
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
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm leading-5 font-medium text-green-800">
                    Registration successful!
                  </p>
                  <p className="text-sm leading-5 text-green-700 mt-1">
                    Worker has been registered with ID: {registeredWorker.workerId}
                  </p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="id-card">
              <TabsList>
                <TabsTrigger value="id-card">ID Card</TabsTrigger>
                <TabsTrigger value="new-registration">New Registration</TabsTrigger>
              </TabsList>
              <TabsContent value="id-card" className="pt-6">
                <WorkerIDCard
                  workerId={registeredWorker.workerId}
                  name={registeredWorker.name}
                  phone={registeredWorker.phone}
                  skill={registeredWorker.skill}
                  originState={registeredWorker.originState}
                />
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    An SMS confirmation has been sent to {registeredWorker.phone} with registration details.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="new-registration" className="pt-6">
                <WorkerRegistrationForm onSuccess={handleRegistrationSuccess} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <WorkerRegistrationForm onSuccess={handleRegistrationSuccess} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkerRegistration;
