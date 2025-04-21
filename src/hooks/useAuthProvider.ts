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
import { auth, firestore } from "@/utils/firebase";
import { User, UserType } from "@/types/auth";
import { getAllBusinessUsers } from "@/utils/businessDatabase";
import { toast } from "sonner";
import { collection, getDocs, query, where } from "firebase/firestore";

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

  const loginWithPhone = async (phone: string): Promise<string> => {
    try {
      setIsLoading(true);
      
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log("Recaptcha verified");
          },
          'expired-callback': () => {
            toast.error("reCAPTCHA expired. Please try again.");
          }
        });
      }
      
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      
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
      
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      
      const workersRef = collection(firestore, "workers");
      const formattedPhone = firebaseUser.phoneNumber?.startsWith("+91") 
        ? firebaseUser.phoneNumber.substring(3) 
        : firebaseUser.phoneNumber;
      
      const q = query(workersRef, where("phone", "==", formattedPhone));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const workerDoc = querySnapshot.docs[0];
        const worker = workerDoc.data();
        
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
