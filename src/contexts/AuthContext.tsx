
import { createContext, useContext, ReactNode } from "react";
import { useUser, useAuth, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, user } = useUser();
  const { userId } = useAuth();
  
  // Check if user has admin role (in a real app, you'd check Clerk user metadata)
  // For this demo, we'll consider any authenticated user an admin
  const isAdmin = !!isSignedIn;
  
  const value = {
    isAuthenticated: !!isSignedIn,
    isAdmin,
    userId: userId || null,
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

// Protected route component
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
};

// Admin route component
export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAppAuth();
  
  return (
    <>
      <SignedIn>
        {isAdmin ? (
          children
        ) : (
          <Navigate to="/unauthorized" replace />
        )}
      </SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
};
