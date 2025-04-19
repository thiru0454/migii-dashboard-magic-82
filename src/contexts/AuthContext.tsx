
import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier
} from "firebase/auth";
import { auth } from "@/utils/firebase";
import { getAllBusinessUsers } from "@/utils/businessDatabase";

type AuthContextType = {
  currentUser: User | null;
  login: (email: string, password: string, userType: UserType) => Promise<boolean>;
  loginWithPhone: (phone: string) => Promise<string>;
  verifyOtp: (verificationId: string, otp: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
};

export type UserType = "admin" | "business" | "worker";

export type User = {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  phone?: string;
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
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    // Set up authentication state observer
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoading(false);
      
      // Firebase user exists but no local user - handle this case
      if (user && !storedUser) {
        // This would happen if Firebase auth persists but local storage was cleared
        // You might want to fetch additional user data from Firestore here
        // For now, we'll just log them out to resync state
        signOut(auth);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, userType: UserType): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (userType === "admin") {
        // Mock admin credentials - in a real app, you'd verify admin status in Firebase
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
        toast.error("Invalid admin credentials");
        setIsLoading(false);
        return false;
      } else if (userType === "business") {
        // Check business users in local storage
        const businessUsers = getAllBusinessUsers();
        const businessUser = businessUsers.find(
          (user: any) => user.email === email && user.password === password
        );
        
        if (businessUser) {
          // Sign in with Firebase (for consistency)
          await signInWithEmailAndPassword(auth, email, password)
            .catch(() => {
              // If Firebase account doesn't exist yet, create one
              return createUserWithEmailAndPassword(auth, email, password);
            });
          
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
        
        toast.error("Invalid business credentials");
        setIsLoading(false);
        return false;
      }
      
      // Shouldn't reach here
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login.");
      setIsLoading(false);
      return false;
    }
  };

  const loginWithPhone = async (phone: string): Promise<string> => {
    try {
      setIsLoading(true);
      
      // Create a new RecaptchaVerifier instance if not exists
      if (!recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        setRecaptchaVerifier(verifier);
      }

      // Send verification code
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        `+${phone}`, 
        recaptchaVerifier!
      );
      
      toast.success("OTP sent successfully!");
      setIsLoading(false);
      return verificationId;
    } catch (error) {
      console.error("Phone login error:", error);
      toast.error("Failed to send OTP. Please try again.");
      setIsLoading(false);
      return "";
    }
  };

  const verifyOtp = async (verificationId: string, otp: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Create the credential
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      
      // Sign in with the credential
      const result = await signInWithCredential(auth, credential);
      const user = result.user;
      
      // For demo, we'll store a simplified user object
      const workerUser: User = {
        id: user.uid,
        email: user.email || "worker@migii.app",
        name: "Worker User",
        userType: "worker",
        phone: user.phoneNumber || "",
      };
      
      setCurrentUser(workerUser);
      localStorage.setItem("currentUser", JSON.stringify(workerUser));
      
      toast.success("Login successful!");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Invalid OTP. Please try again.");
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    signOut(auth).then(() => {
      setCurrentUser(null);
      localStorage.removeItem("currentUser");
      toast.success("Logged out successfully");
    }).catch((error) => {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    });
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      loginWithPhone, 
      verifyOtp, 
      logout, 
      isLoading 
    }}>
      {children}
      <div id="recaptcha-container"></div>
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

// A wrapper for routes that require worker authentication
export const RequireWorker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    // Not logged in, redirect to login page
    return <Navigate to="/worker-login" state={{ from: location }} replace />;
  }

  if (currentUser.userType !== "worker") {
    // Logged in but not a worker, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // User is a worker, allow access
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
