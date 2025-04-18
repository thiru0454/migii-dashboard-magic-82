
import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

type AuthContextType = {
  currentUser: User | null;
  login: (email: string, password: string, userType: UserType) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
};

export type UserType = "admin" | "business" | "worker";

export type User = {
  id: string;
  email: string;
  name: string;
  userType: UserType;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, userType: UserType): Promise<boolean> => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      if (userType === "admin") {
        // Mock admin credentials
        if (email === "admin@migii.com" && password === "admin123") {
          const user: User = {
            id: "admin-1",
            email,
            name: "Admin User",
            userType: "admin",
          };
          setCurrentUser(user);
          localStorage.setItem("currentUser", JSON.stringify(user));
          toast.success("Admin login successful!");
          setIsLoading(false);
          return true;
        }
      } else if (userType === "business") {
        // Check business users in local storage
        const businessUsers = JSON.parse(localStorage.getItem("businessUsers") || "[]");
        const businessUser = businessUsers.find(
          (user: any) => user.email === email && user.password === password
        );
        
        if (businessUser) {
          const user: User = {
            id: businessUser.id,
            email,
            name: businessUser.name,
            userType: "business",
          };
          setCurrentUser(user);
          localStorage.setItem("currentUser", JSON.stringify(user));
          toast.success("Business login successful!");
          setIsLoading(false);
          return true;
        }
      }
      
      // Login failed
      toast.error("Invalid credentials. Please try again.");
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login.");
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// A wrapper for routes that require admin authentication
export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    // Not logged in, redirect to login page with the current location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.userType !== "admin") {
    // Logged in but not an admin, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // User is an admin, allow access
  return <>{children}</>;
};

// A wrapper for routes that require business authentication
export const RequireBusiness: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.userType !== "business") {
    // Logged in but not a business, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // User is a business, allow access
  return <>{children}</>;
};

// A wrapper for routes that require any authentication
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, allow access
  return <>{children}</>;
};
