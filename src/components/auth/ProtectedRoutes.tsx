
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType?: "admin" | "business" | "worker";
}

const ProtectedRoute = ({ children, userType }: ProtectedRouteProps) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userType && currentUser.userType !== userType) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export const RequireAdmin = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute userType="admin">{children}</ProtectedRoute>
);

export const RequireBusiness = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute userType="business">{children}</ProtectedRoute>
);

export const RequireWorker = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute userType="worker">{children}</ProtectedRoute>
);

export const RequireAuth = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);
