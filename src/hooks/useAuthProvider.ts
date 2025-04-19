
import { useState, useEffect, useRef } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier
} from "firebase/auth";
import { auth, database } from "@/utils/firebase";
import { User, UserType } from "@/types/auth";
import { getAllBusinessUsers } from "@/utils/businessDatabase";
import { toast } from "sonner";
import { ref, get, child } from "firebase/database";

export const useAuthProvider = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

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

    return () => {
      unsubscribe();
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
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

  // Implement phone login with Firebase
  const loginWithPhone = async (phone: string): Promise<string> => {
    try {
      setIsLoading(true);
      
      // Initialize RecaptchaVerifier if not already initialized
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            console.log("Recaptcha verified");
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            toast.error("reCAPTCHA expired. Please try again.");
          }
        });
      }
      
      // Format phone number if needed
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      
      // Send verification code
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        formattedPhone, 
        recaptchaVerifierRef.current
      );
      
      toast.success("OTP sent successfully!");
      setIsLoading(false);
      return verificationId;
    } catch (error: any) {
      console.error("Phone login error:", error);
      toast.error(`Failed to send OTP: ${error.message || error}`);
      setIsLoading(false);
      throw error;
    }
  };

  const verifyOtp = async (verificationId: string, otp: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Create credential
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      
      // Sign in with credential
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      
      // Check if user exists in worker database
      const dbRef = ref(database);
      const workersSnapshot = await get(child(dbRef, 'workers'));
      let workerData;
      
      if (workersSnapshot.exists()) {
        const workersData = workersSnapshot.val();
        const workersArray = Object.values(workersData);
        
        // Find worker by phone number
        workerData = workersArray.find((worker: any) => {
          const workerPhone = worker.phone;
          const formattedPhone = `+91${workerPhone}`;
          return workerPhone === firebaseUser.phoneNumber || formattedPhone === firebaseUser.phoneNumber;
        });
      }
      
      if (workerData) {
        // Create worker user object
        const worker = workerData as any;
        const workerUser: User = {
          id: worker.id,
          email: `worker-${worker.phone}@migii.app`,
          name: worker.name,
          userType: "worker",
          phone: worker.phone,
        };
        
        setCurrentUser(workerUser);
        localStorage.setItem("currentUser", JSON.stringify(workerUser));
        
        toast.success("Login successful!");
        setIsLoading(false);
        return true;
      } else {
        // User authenticated but not found in worker database
        toast.error("Phone number not found in registered workers. Please register first.");
        await signOut(auth);
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(`Invalid OTP: ${error.message || "Please try again"}`);
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
