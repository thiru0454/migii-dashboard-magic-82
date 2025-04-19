
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkerTabs } from "@/components/worker/WorkerTabs";
import { WorkerLoginCard } from "@/components/worker/WorkerLoginCard";
import { useAuth } from "@/contexts/AuthContext";

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

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleSignOut = () => {
    logout();
    setIsLoggedIn(false);
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
          <WorkerLoginCard onSuccess={handleLoginSuccess} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkerLogin;
