
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkerTabs } from "@/components/worker/WorkerTabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";
import { WorkerLoginForm } from "@/components/forms/WorkerLoginForm";
import { getAllWorkersFromStorage } from "@/utils/firebase";

const WorkerLogin = () => {
  const { currentUser, logout } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [workerData, setWorkerData] = useState({
    workerId: "",
    name: "Worker User",
    phone: "",
    skill: "Construction Worker",
    originState: "Bihar",
    status: "Active",
    supportHistory: [
      {
        id: "REQ-001",
        date: "2024-04-01",
        issue: "Accommodation request",
        status: "Pending",
      },
      {
        id: "REQ-002",
        date: "2024-03-15",
        issue: "Payment discrepancy",
        status: "Resolved",
      },
    ],
  });
  
  const navigate = useNavigate();
  
  // Check if already logged in and fetch worker data
  useEffect(() => {
    if (currentUser && currentUser.userType === "worker") {
      setIsLoggedIn(true);
      
      // Fetch worker details from storage based on currentUser info
      const workers = getAllWorkersFromStorage();
      const worker = workers.find(w => w.id === currentUser.id || w.phone === currentUser.phone);
      
      if (worker) {
        setWorkerData({
          workerId: worker.id,
          name: worker.name,
          phone: worker.phone,
          skill: worker.skill || "Construction Worker",
          originState: worker.originState,
          status: worker.status || "Active",
          supportHistory: workerData.supportHistory, // Keep existing support history
        });
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [currentUser]);

  const handleSignOut = () => {
    logout();
    setIsLoggedIn(false);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 my-6">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight">Worker Login</h1>
          <p className="text-muted-foreground mt-2">
            Access your Migii worker dashboard
          </p>
        </div>

        {isLoggedIn ? (
          <WorkerTabs 
            workerData={workerData} 
            onSignOut={handleSignOut} 
          />
        ) : (
          <div className="flex items-center justify-center w-full min-h-[calc(100vh-200px)] py-8">
            <Card className="w-full max-w-md mx-auto shadow-lg border-border">
              <CardHeader className="text-center space-y-2 pb-6">
                <CardTitle className="text-2xl font-bold text-primary">Worker Login</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your phone number to access your worker dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8">
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
