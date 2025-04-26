import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { RecaptchaVerifier, signInWithPhoneNumber } from "@/utils/firebase";
import { sendOtpEmail, verifyOtp } from "@/utils/emailService";

interface WorkerLoginFormProps {
  onSuccess: () => void;
}

const formSchema = z.object({
  phone: z
    .string()
    .min(10, {
      message: "Phone number must be at least 10 digits.",
    })
    .max(15, {
      message: "Phone number cannot be longer than 15 digits.",
    })
    .regex(/^[0-9]+$/, {
      message: "Phone number can only contain digits.",
    }),
  email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .optional(),
});

const OTP_LENGTH = 6;

export function WorkerLoginForm({ onSuccess }: WorkerLoginFormProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const { loginWithPhone } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      email: "",
    },
  });

  const onSubmitPhone = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const phoneNumber = values.phone;
    const emailAddress = values.email || "";
    
    setPhone(phoneNumber);
    setEmail(emailAddress);
    
    try {
      if (emailAddress) {
        console.log(`Attempting to send OTP to email: ${emailAddress}`);
        const otpSent = await sendOtpEmail(emailAddress);
        
        if (otpSent) {
          setVerificationId("email-verification");
          setStep("otp");
          toast.success(`OTP sent to ${emailAddress}. Please check your inbox.`);
        } else {
          toast.error("Failed to send OTP email. Please try again or use phone number.");
        }
      } else {
        try {
          console.log(`Attempting to send OTP via SMS to: ${phoneNumber}`);
          const verId = await signInWithPhoneNumber(phoneNumber);
          if (verId) {
            setVerificationId(verId);
            setStep("otp");
            toast.success("OTP sent successfully!");
          }
        } catch (smsError: any) {
          console.error("SMS OTP error:", smsError);
          toast.error(smsError.message || "SMS OTP failed. Please provide an email address for OTP instead.");
        }
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= OTP_LENGTH) {
      setOtp(value);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    try {
      if (verificationId === "email-verification") {
        // Verify email OTP
        if (email && verifyOtp(email, otp)) {
          // Try login with phone (which is available from registration)
          try {
            await loginWithPhone(phone);
            toast.success("Login successful!");
            onSuccess();
          } catch (loginError: any) {
            console.error("Login error after OTP verification:", loginError);
            toast.error(loginError.message || "Login failed after OTP verification");
          }
        } else {
          toast.error("Invalid OTP. Please try again.");
        }
      } else {
        try {
          // For SMS verification
          await loginWithPhone(phone);
          toast.success("Login successful!");
          onSuccess();
        } catch (error: any) {
          console.error("Phone login error:", error);
          toast.error(error.message || "OTP verification failed");
        }
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error(error.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSubmitting(true);
    try {
      if (email) {
        const otpSent = await sendOtpEmail(email);
        if (otpSent) {
          toast.success("OTP resent to your email");
        } else {
          toast.error("Failed to resend OTP to email");
        }
      } else if (phone) {
        try {
          await signInWithPhoneNumber(phone);
          toast.success("OTP resent successfully!");
        } catch (error: any) {
          console.error("Error resending SMS OTP:", error);
          toast.error("Failed to resend OTP via SMS");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {step === "phone" ? (
        <>
          <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPhone)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="phone">Phone Number</Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="phone"
                        placeholder="Enter your phone number"
                        type="tel"
                        className="text-base py-2"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="email">Email Address (Recommended)</Label>
                    <FormControl>
                      <Input
                        {...field}
                        id="email"
                        placeholder="Enter your email address"
                        type="email"
                        className="text-base py-2"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Using email for OTP is more reliable than SMS
                    </p>
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          </Form>
        </>
      ) : (
        <div className="space-y-6">
          <div>
            <Label htmlFor="otp" className="block mb-2">
              Enter OTP sent to {email || phone}
            </Label>
            <div className="flex items-center">
              <Input
                id="otp"
                value={otp}
                onChange={handleOtpChange}
                placeholder={`Enter ${OTP_LENGTH}-digit OTP`}
                maxLength={OTP_LENGTH}
                className="text-center text-2xl tracking-widest py-2"
                disabled={isSubmitting}
              />
            </div>
            <div className="text-center mt-2">
              <Button
                variant="link"
                type="button"
                className="text-xs"
                onClick={() => setStep("phone")}
                disabled={isSubmitting}
              >
                Change contact information
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleVerifyOtp} 
            className="w-full"
            disabled={isSubmitting || otp.length !== OTP_LENGTH}
          >
            {isSubmitting ? "Verifying..." : "Verify & Login"}
          </Button>
          <div className="text-center">
            <Button
              variant="link"
              type="button"
              className="text-xs"
              onClick={handleResendOtp}
              disabled={isSubmitting}
            >
              Didn't receive code? Resend OTP
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
