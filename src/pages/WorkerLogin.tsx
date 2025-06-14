import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkerTabs } from "@/components/worker/WorkerTabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";
import { WorkerLoginForm } from "@/components/forms/WorkerLoginForm";
import { getAllWorkers } from "@/utils/supabaseClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const WorkerLogin = () => {
  const { currentUser, logout } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [workerData, setWorkerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchWorkerData = async () => {
      if (currentUser && currentUser.userType === "worker" && !workerData) {
        setIsLoading(true);
        try {
          const { data: workers, error } = await getAllWorkers();
          if (error) {
            console.error("Error fetching workers:", error);
            return;
          }
          const worker = workers.find(
            (w: any) =>
              (w.phone && w.phone.trim() === currentUser.phone?.trim()) ||
              (w.email && w.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
              (w["Phone Number"] && w["Phone Number"].trim() === currentUser.phone?.trim()) ||
              (w["Email Address"] && w["Email Address"].trim().toLowerCase() === currentUser.email.trim().toLowerCase())
          );
          if (worker) {
            setWorkerData(worker);
            setIsLoggedIn(true);
          }
        } catch (err) {
          console.error("Error in fetchWorkerData:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchWorkerData();
  }, [currentUser, workerData]);

  const handleLoginSuccess = (worker: any) => {
    setWorkerData(worker);
    setIsLoggedIn(true);
    
    // Redirect to worker dashboard
    navigate("/worker/dashboard");
  };

  const handleSignOut = () => {
    logout();
    setIsLoggedIn(false);
    setWorkerData(null);
    navigate("/worker-login");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 my-6">
        {isLoggedIn ? (
          isLoading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <LoadingSpinner />
            </div>
          ) : workerData ? (
            <WorkerTabs 
              workerData={workerData} 
              onSignOut={handleSignOut} 
            />
          ) : (
            <div className="text-center text-lg text-red-500 py-12">No worker data found.</div>
          )
        ) : (
          <div className="flex items-center justify-center w-full min-h-[calc(100vh-200px)] py-8">
            <Card className="w-full max-w-md mx-auto shadow-lg border-border">
              <CardHeader className="text-center space-y-2 pb-6">
                <CardTitle className="text-2xl font-bold text-primary">Worker Login</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your phone number or email to access your worker dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                  <InfoIcon className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700">
                    Enter your registered email or phone number to receive a one-time password.
                  </AlertDescription>
                </Alert>
                
                <WorkerLoginForm onSuccess={handleLoginSuccess} />
                
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <p>Not registered yet?</p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate("/worker-registration")}
                  >
                    Register as Worker
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkerLogin;