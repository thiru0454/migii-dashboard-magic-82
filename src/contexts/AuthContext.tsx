
import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useUser, useAuth, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate, useNavigate } from "react-router-dom";

type UserType = "admin" | "worker" | "business" | null;

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBusiness: boolean;
  userType: UserType;
  userId: string | null;
  businessData: any | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, user } = useUser();
  const { userId } = useAuth();
  const [userType, setUserType] = useState<UserType>(null);
  const [businessData, setBusinessData] = useState<any>(null);
  const navigate = useNavigate();
  
  // Check authentication status on mount and when it changes
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const businessUser = localStorage.getItem("businessUser");
    
    if (isAdmin) {
      setUserType("admin");
    } else if (businessUser) {
      setUserType("business");
      setBusinessData(JSON.parse(businessUser));
    } else if (isSignedIn) {
      setUserType("worker");
    } else {
      setUserType(null);
    }
  }, [isSignedIn]);
  
  const logout = () => {
    if (userType === "admin") {
      localStorage.removeItem("isAdmin");
      setUserType(null);
      navigate("/login");
    } else if (userType === "business") {
      localStorage.removeItem("businessUser");
      setBusinessData(null);
      setUserType(null);
      navigate("/login");
    }
    // Clerk handles worker logout
  };
  
  const value = {
    isAuthenticated: userType !== null,
    isAdmin: userType === "admin",
    isBusiness: userType === "business",
    userType,
    userId: userId || null,
    businessData,
    logout,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAppAuth must be used within an AuthProvider");
  }
  return context;
};

// Protected route component that works for any authenticated user
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAppAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin route component
export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAppAuth();
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Business route component
export const RequireBusiness = ({ children }: { children: ReactNode }) => {
  const { isBusiness } = useAppAuth();
  
  if (!isBusiness) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
