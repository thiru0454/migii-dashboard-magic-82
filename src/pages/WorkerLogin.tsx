
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkerTabs } from "@/components/worker/WorkerTabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";

const WorkerLogin = () => {
  const { currentUser, logout } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  
  // Check if already logged in
  useEffect(() => {
    if (currentUser && currentUser.userType === "worker") {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [currentUser]);
  
  const workerData = {
    workerId: currentUser?.id || "TN-MIG-20240101-12345",
    name: currentUser?.name || "Worker User",
    phone: currentUser?.phone || "9876543210",
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
  };

  const handleSignOut = () => {
    logout();
    setIsLoggedIn(false);
  };

  const redirectToLogin = () => {
    navigate("/login?tab=worker");
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
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={redirectToLogin}
                >
                  <LogIn className="h-4 w-4" />
                  Login with Phone Number
                </Button>
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
