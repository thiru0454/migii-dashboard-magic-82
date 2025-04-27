import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendOtpEmail, verifyOtp } from "@/utils/emailService";
import { toast } from "sonner";
import { AlertCircle, Loader2, Mail, MessageSquare, Phone, Timer } from "lucide-react";
import { findWorkerByEmail, findWorkerByPhone } from "@/utils/firebase";
import { useIsMobile } from "@/hooks/use-mobile";

const contactSchema = z.object({
  contact: z.string().min(1, { message: "Email or phone number is required" }),
});

const otpSchema = z.object({
  otp: z.string().min(6, { message: "OTP should be 6 digits" }),
});

interface WorkerLoginFormProps {
  onSuccess: () => void;
}

export function WorkerLoginForm({ onSuccess }: WorkerLoginFormProps) {
  const [step, setStep] = useState<"contact" | "otp">("contact");
  const [isLoading, setIsLoading] = useState(false);
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const isMobile = useIsMobile();

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
      
      const worker = isEmail
        ? await findWorkerByEmail(contactValue)
        : await findWorkerByPhone(contactValue);
      
      if (!worker) {
        setError(`No worker found with this ${isEmail ? 'email' : 'phone number'}`);
        setIsLoading(false);
        return;
      }
      
      const emailToUse = isEmail 
        ? contactValue 
        : (worker.email || `${contactValue}@migii.worker.temp`);
      
      const sent = await sendOtpEmail(emailToUse);
      
      if (sent) {
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
      } else {
        setError("Failed to send OTP. Please try again.");
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
      const isEmail = contact.includes('@');
      
      const worker = isEmail
        ? await findWorkerByEmail(contact)
        : await findWorkerByPhone(contact);
        
      if (!worker) {
        setError("Worker not found");
        setIsLoading(false);
        return;
      }
      
      const emailToUse = isEmail 
        ? contact 
        : (worker.email || `${contact}@migii.worker.temp`);
        
      const isValid = verifyOtp(emailToUse, data.otp);
      
      if (isValid) {
        toast.success("Login successful!");
        localStorage.setItem('currentWorker', JSON.stringify(worker));
        onSuccess();
      } else {
        setError("Invalid OTP. Please try again.");
      }
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
      
      const worker = isEmail
        ? await findWorkerByEmail(contact)
        : await findWorkerByPhone(contact);
        
      if (!worker) {
        setError("Worker not found");
        setIsLoading(false);
        return;
      }
      
      const emailToUse = isEmail 
        ? contact 
        : (worker.email || `${contact}@migii.worker.temp`);
        
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === "contact" ? (
        <Form {...contactForm}>
          <form onSubmit={contactForm.handleSubmit(handleSendOTP)} className="space-y-6">
            <FormField
              control={contactForm.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="Enter your email or phone number" 
                        {...field} 
                        className="pl-10"
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
                    We'll send a one-time password to this contact
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-6">
            <div className="space-y-2">
              <FormLabel>Enter OTP sent to {contact}</FormLabel>
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
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
              className="w-full"
              onClick={() => setStep("contact")}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
