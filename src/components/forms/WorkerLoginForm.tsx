import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendOtpEmail } from "@/utils/emailService";
import { confirmOtp } from "@/utils/firebase";
import { toast } from "sonner";
import { AlertCircle, Loader2, Mail, MessageSquare, Phone, Timer } from "lucide-react";
import { getAllWorkers } from "@/utils/supabaseClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkerByContact, getWorkerDirectFromSupabase } from "@/utils/firebase";

const contactSchema = z.object({
  contact: z.string().min(1, { message: "Email or phone number is required" }),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: "OTP should be 6 digits" }),
});

interface WorkerLoginFormProps {
  onSuccess: (workerData: any) => void;
}

export function WorkerLoginForm({ onSuccess }: WorkerLoginFormProps) {
  const [step, setStep] = useState<"contact" | "otp">("contact");
  const [isLoading, setIsLoading] = useState(false);
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const isMobile = useIsMobile();
  const { currentUser, login, logout } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact: "",
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const handleSendOTP = async (data: z.infer<typeof contactSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const contactValue = data.contact.trim();
      setContact(contactValue);
      const isEmail = contactValue.includes('@');
      
      // Try to find worker in Supabase first
      console.log('[WorkerLoginForm] handleSendOTP - contact:', contactValue);
      
      let worker = null;
      
      // Try direct Supabase query first
      try {
        worker = await getWorkerDirectFromSupabase(contactValue);
        console.log('[WorkerLoginForm] handleSendOTP - worker from direct Supabase:', worker);
      } catch (directError) {
        console.error("Error in direct Supabase query:", directError);
      }
      
      // If direct query failed, try getAllWorkers
      if (!worker) {
        try {
          const { data: workers, error } = await getAllWorkers();
          console.log('[WorkerLoginForm] handleSendOTP - fetched workers:', workers);
          
          if (error || !workers) {
            console.error("Error fetching workers from Supabase:", error);
            // Try localStorage
            worker = await getWorkerByContact(contactValue);
          } else {
            // Find matching worker
            worker = workers.find(
              (w: any) =>
                (w["Email Address"] && String(w["Email Address"]).trim().toLowerCase() === contactValue.trim().toLowerCase()) ||
                (w.email && String(w.email).trim().toLowerCase() === contactValue.trim().toLowerCase()) ||
                (w["Phone Number"] && String(w["Phone Number"]).trim() === contactValue.trim()) ||
                (w.phone && String(w.phone).trim() === contactValue.trim())
            );
          }
        } catch (getAllError) {
          console.error("Error in getAllWorkers:", getAllError);
          // Try localStorage as last resort
          worker = await getWorkerByContact(contactValue);
        }
      }
      
      console.log('[WorkerLoginForm] handleSendOTP - matched worker:', worker);
      
      if (!worker) {
        setError(`No worker found with this ${isEmail ? 'email' : 'phone number'}`);
        setIsLoading(false);
        return;
      }
      
      // Get the email to send OTP to
      const emailToUse = isEmail 
        ? contactValue 
        : (worker.email || worker["Email Address"]);
        
      if (!emailToUse) {
        setError("No email address found for this worker. Please contact support.");
        setIsLoading(false);
        return;
      }
      
      setEmailSentTo(emailToUse);
      
      // Actually send the OTP email
      const sent = await sendOtpEmail(emailToUse);
      
      if (sent) {
        setOtpSent(true);
        setStep("otp");
        setTimeLeft(60);
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toast.success(`OTP sent to ${emailToUse}`, {
          description: "Please check your email for the OTP code."
        });
      } else {
        // Even if email sending fails, we'll allow login with the test OTP
        setOtpSent(true);
        setStep("otp");
        setTimeLeft(60);
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toast.info("For testing purposes, use OTP: 123456", {
          description: "Email service is in demo mode"
        });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data: z.infer<typeof otpSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      // Verify OTP
      const isValid = confirmOtp(emailSentTo || contact, data.otp);
      
      if (!isValid) {
        setError("Invalid OTP. Please try again.");
        setIsLoading(false);
        return;
      }
      
      const isEmail = contact.includes('@');
      
      // Try to find worker
      let worker = null;
      
      // Try direct Supabase query first
      try {
        worker = await getWorkerDirectFromSupabase(contact);
        console.log('[WorkerLoginForm] handleVerifyOTP - worker from direct Supabase:', worker);
      } catch (directError) {
        console.error("Error in direct Supabase query:", directError);
      }
      
      // If direct query failed, try getAllWorkers
      if (!worker) {
        try {
          const { data: workers, error } = await getAllWorkers();
          console.log('[WorkerLoginForm] handleVerifyOTP - fetched workers:', workers);
          
          if (error || !workers) {
            console.error("Error fetching workers from Supabase:", error);
            // Try localStorage
            worker = await getWorkerByContact(contact);
          } else {
            // Find matching worker
            worker = workers.find(
              (w: any) =>
                (w["Email Address"] && String(w["Email Address"]).trim().toLowerCase() === contact.trim().toLowerCase()) ||
                (w.email && String(w.email).trim().toLowerCase() === contact.trim().toLowerCase()) ||
                (w["Phone Number"] && String(w["Phone Number"]).trim() === contact.trim()) ||
                (w.phone && String(w.phone).trim() === contact.trim())
            );
          }
        } catch (getAllError) {
          console.error("Error in getAllWorkers:", getAllError);
          // Try localStorage as last resort
          worker = await getWorkerByContact(contact);
        }
      }
      
      console.log('[WorkerLoginForm] handleVerifyOTP - matched worker:', worker);
      
      if (!worker) {
        setError("Worker not found");
        setIsLoading(false);
        return;
      }
      
      // Set Auth context's currentUser to the logged-in worker
      const workerUser = {
        id: worker.id,
        email: worker.email || worker["Email Address"] || `worker-${contact}@migii.app`,
        name: worker.name || worker["Full Name"] || "Worker",
        userType: "worker",
        phone: worker.phone || worker["Phone Number"] || contact,
      };
      
      localStorage.setItem('currentUser', JSON.stringify(workerUser));
      
      if (typeof login === 'function') {
        // Use login to set currentUser in context
        await login(workerUser.email, '', 'worker');
      }
      
      toast.success("Login successful!");
      onSuccess(worker);
    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 0) return;
    
    setIsLoading(true);
    try {
      const isEmail = contact.includes('@');
      
      // Try to find worker
      let worker = null;
      
      // Try direct Supabase query first
      try {
        worker = await getWorkerDirectFromSupabase(contact);
      } catch (directError) {
        console.error("Error in direct Supabase query:", directError);
      }
      
      // If direct query failed, try getAllWorkers
      if (!worker) {
        try {
          const { data: workers, error } = await getAllWorkers();
          
          if (error || !workers) {
            console.error("Error fetching workers from Supabase:", error);
            // Try localStorage
            worker = await getWorkerByContact(contact);
          } else {
            // Find matching worker
            worker = workers.find(
              (w: any) =>
                (w["Email Address"] && String(w["Email Address"]).trim().toLowerCase() === contact.trim().toLowerCase()) ||
                (w.email && String(w.email).trim().toLowerCase() === contact.trim().toLowerCase()) ||
                (w["Phone Number"] && String(w["Phone Number"]).trim() === contact.trim()) ||
                (w.phone && String(w.phone).trim() === contact.trim())
            );
          }
        } catch (getAllError) {
          console.error("Error in getAllWorkers:", getAllError);
          // Try localStorage as last resort
          worker = await getWorkerByContact(contact);
        }
      }
      
      if (!worker) {
        setError("Worker not found");
        setIsLoading(false);
        return;
      }
      
      // Get the email to send OTP to
      const emailToUse = isEmail 
        ? contact 
        : (worker.email || worker["Email Address"]);
        
      if (!emailToUse) {
        setError("No email address found for this worker. Please contact support.");
        setIsLoading(false);
        return;
      }
      
      setEmailSentTo(emailToUse);
      
      // Send the OTP email
      const sent = await sendOtpEmail(emailToUse);
      
      if (sent) {
        setTimeLeft(60);
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toast.success(`OTP resent to ${emailToUse}`, {
          description: "Please check your email for the OTP code."
        });
      } else {
        // Even if email sending fails, we'll allow login with the test OTP
        setTimeLeft(60);
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        toast.info("For testing purposes, use OTP: 123456", {
          description: "Email service is in demo mode"
        });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while resending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive\" className="animate-in fade-in slide-in-from-top duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === "contact" ? (
        <Form {...contactForm}>
          <form onSubmit={contactForm.handleSubmit(handleSendOTP)} className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
            <FormField
              control={contactForm.control}
              name="contact"
              render={({ field }) => (
                <FormItem className="hover-glow rounded-lg">
                  <FormLabel>Email or Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Enter your email or phone number" 
                        {...field} 
                        className="pl-10 transition-all duration-200 hover:border-primary/50 focus:border-primary"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {field.value.includes('@') ? 
                          <Mail className="h-5 w-5" /> : 
                          <Phone className="h-5 w-5" />
                        }
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    We'll send a one-time password to your email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full hover-scale" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm\" className="mr-2" />
                  Sending OTP...
                </>
              ) : (
                "Get OTP"
              )}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="space-y-2">
              <FormLabel>Enter OTP sent to {emailSentTo || contact}</FormLabel>
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </FormControl>
                    <FormDescription className="text-center">
                      {timeLeft > 0 ? (
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Timer className="h-4 w-4" />
                          <span>Resend OTP in {timeLeft} seconds</span>
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          onClick={handleResendOTP} 
                          className="text-primary hover:underline"
                          disabled={isLoading}
                        >
                          Resend OTP
                        </button>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full hover-scale" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm\" className="mr-2" />
                  Verifying...
                </>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Verify OTP</span>
                </div>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full hover-scale"
              onClick={() => setStep("contact")}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </form>
        </Form>
      )}

      {otpSent && (
        <div className="text-center text-sm text-muted-foreground mt-4 p-3 bg-primary/5 rounded-md">
          <p className="font-medium">Check your email for the OTP code</p>
          <p className="mt-1">If you don't receive it, check your spam folder or click "Resend OTP" after the timer expires.</p>
        </div>
      )}
    </div>
  );
}