
import { useState, useEffect } from "react";
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
import { User, UserType } from "@/types/auth";
import { getAllBusinessUsers } from "@/utils/businessDatabase";
import { toast } from "sonner";

export const useAuthProvider = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoading(false);
      
      if (user && !storedUser) {
        signOut(auth);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, userType: UserType): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (userType === "admin") {
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
        const businessUsers = getAllBusinessUsers();
        const businessUser = businessUsers.find(
          (user: any) => user.email === email && user.password === password
        );
        
        if (businessUser) {
          await signInWithEmailAndPassword(auth, email, password)
            .catch(() => createUserWithEmailAndPassword(auth, email, password));
          
          const user: User = {
            id: businessUser.id,
            email,
            name: businessUser.name,
            userType: "business",
            businessId: businessUser.id,
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
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login.");
      setIsLoading(false);
      return false;
    }
  };

  // Mock phone login for demonstration
  const loginWithPhone = async (phone: string): Promise<string> => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would call Firebase
      // For demo purposes, we'll mock this and immediately return a verification ID
      const mockVerificationId = "mock-verification-id-" + Date.now();
      
      console.log("Mock OTP sent for phone:", phone);
      toast.success("Demo mode: OTP sent successfully! (Use code: 123456)");
      setIsLoading(false);
      return mockVerificationId;
    } catch (error) {
      console.error("Phone login error:", error);
      toast.error("Failed to send OTP. Using demo mode.");
      setIsLoading(false);
      // Still return a mock verification ID to allow the flow to continue
      return "mock-error-verification-id-" + Date.now();
    }
  };

  const verifyOtp = async (verificationId: string, otp: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // For demo purposes, any 6-digit code will work, but we'll suggest 123456
      if (otp.length === 6) {
        // Create a mock user
        const workerUser: User = {
          id: "worker-" + Date.now(),
          email: "worker@migii.app",
          name: "Worker User",
          userType: "worker",
          phone: "Demo Mode",
        };
        
        setCurrentUser(workerUser);
        localStorage.setItem("currentUser", JSON.stringify(workerUser));
        
        toast.success("Login successful! (Demo mode)");
        setIsLoading(false);
        return true;
      }
      
      toast.error("Please enter a 6-digit OTP");
      setIsLoading(false);
      return false;
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

  return {
    currentUser,
    isLoading,
    login,
    loginWithPhone,
    verifyOtp,
    logout,
  };
};
