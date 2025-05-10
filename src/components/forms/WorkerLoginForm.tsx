import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/lib/supabase";

interface WorkerLoginFormProps {
  onSuccess: (worker: any) => void;
}

export function WorkerLoginForm({ onSuccess }: WorkerLoginFormProps) {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSendOTP = async () => {
    try {
      // Basic phone number validation
      if (!phone || phone.length < 10) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid 10-digit phone number",
        });
        return;
      }

      setVerifying(true);

      // Sign in user with phone number
      const { error } = await signIn({ phone: phone });

      if (error) {
        console.error("Error sending OTP:", error);
        toast({
          title: "Error sending OTP",
          description: "Failed to send OTP. Please try again.",
        });
        return;
      }

      setOtpSent(true);
      toast({
        title: "OTP sent",
        description: "Please enter the OTP sent to your phone number.",
      });
    } catch (error) {
      console.error("Error in handleSendOTP:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setVerifying(true);
      
      // For the demo, we're using a simple verification
      // In production, verify the actual OTP from a service
      
      // Match the worker based on phone number
      const { data: workers, error } = await supabase
        .from('workers')
        .select('*')
        .eq('phone', phone)
        .single();
        
      if (error) {
        console.error("Error fetching worker:", error);
        toast.error("Worker verification failed");
        return;
      }
      
      if (!workers) {
        toast.error("No worker found with this phone number");
        return;
      }
      
      console.log("[WorkerLoginForm] handleVerifyOTP - matched worker:", workers);
      
      // Store user info in localStorage
      const userInfo = {
        id: workers.id,
        name: workers.name || workers["Full Name"],
        phone: workers.phone || workers["Phone Number"],
        email: workers.email || workers["Email Address"],
        userType: "worker",
      };
      
      localStorage.setItem("currentUser", JSON.stringify(userInfo));
      
      toast.success("Login successful!");
      
      // Trigger the onSuccess callback with the worker data
      onSuccess(workers);
    } catch (error) {
      console.error("Error in OTP verification:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {!otpSent ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <Input
              id="phone"
              placeholder="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={verifying}
            />
          </div>
          <Button className="w-full" onClick={handleSendOTP} disabled={verifying}>
            {verifying ? <LoadingSpinner size="sm" /> : "Send OTP"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="space-y-1">
            <Input
              id="otp"
              placeholder="OTP"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={verifying}
            />
          </div>
          <Button className="w-full" onClick={handleVerifyOTP} disabled={verifying}>
            {verifying ? <LoadingSpinner size="sm" /> : "Verify OTP"}
          </Button>
        </div>
      )}
    </div>
  );
}
