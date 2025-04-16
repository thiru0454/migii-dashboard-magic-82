import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSignIn } from "@clerk/clerk-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const loginSchema = z.object({
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
});

const otpSchema = z.object({
  otp: z.string().min(6, {
    message: "OTP must be 6 digits.",
  }),
});

interface WorkerLoginFormProps {
  onSuccess?: () => void;
}

export function WorkerLoginForm({ onSuccess }: WorkerLoginFormProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const { signIn, setActive, isLoaded } = useSignIn();
  
  // Phone form
  const phoneForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
    },
  });

  // OTP form
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onPhoneSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      if (!isLoaded || !signIn) {
        throw new Error("Clerk is not loaded yet");
      }

      // Format the phone number with country code if not already present
      let formattedPhone = values.phone;
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+91" + formattedPhone; // Assuming Indian phone numbers
      }
      
      // Send SMS using Clerk
      const { supportedFirstFactors } = await signIn.create({
        identifier: formattedPhone,
      });

      // Find the phone code factor
      const phoneCodeFactor = supportedFirstFactors.find(
        factor => factor.strategy === "phone_code"
      );

      if (!phoneCodeFactor) {
        throw new Error("Phone code authentication not supported");
      }

      // Start the phone code verification
      const phoneVerification = await signIn.prepareFirstFactor({
        strategy: "phone_code",
        phoneNumberId: phoneCodeFactor.safeIdentifier as string,
      });

      // Use the verification ID from the firstFactorVerification object
      const vId = phoneVerification.firstFactorVerification.status === "needs_first_factor" 
        ? phoneVerification.firstFactorVerification.externalVerificationRedirectURL?.split("verification_id=")[1]?.split("&")[0] 
        : "";
      
      setVerificationId(vId || "");
      setPhoneNumber(values.phone);
      setStep("otp");
      
      toast.success("OTP sent successfully!", {
        description: `A verification code has been sent to ${values.phone}`,
      });
    } catch (error) {
      console.error("OTP send error:", error);
      toast.error("Failed to send OTP", {
        description: "Please check your phone number and try again",
      });
    }
  };

  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    try {
      if (!isLoaded || !signIn) {
        throw new Error("Clerk is not loaded yet");
      }

      if (!verificationId) {
        // If we don't have a verificationId, attempt to verify using just the code
        const result = await signIn.attemptFirstFactor({
          strategy: "phone_code",
          code: values.otp,
        });

        if (result.status === "complete") {
          // Set this session as active
          await setActive({ session: result.createdSessionId });
          
          toast.success("Login successful!", {
            description: "You have been logged in successfully",
          });
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          throw new Error("Verification failed");
        }
      } else {
        // This is a fallback approach if the above doesn't work
        console.log("Using verificationId for verification: " + verificationId);
        const result = await signIn.attemptFirstFactor({
          strategy: "phone_code",
          code: values.otp,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          
          toast.success("Login successful!", {
            description: "You have been logged in successfully",
          });
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          throw new Error("Verification failed");
        }
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Failed to verify OTP", {
        description: "Please try again with the correct OTP",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step === "phone" ? (
        <Form {...phoneForm}>
          <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
            <FormField
              control={phoneForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your registered phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={phoneForm.formState.isSubmitting}>
              {phoneForm.formState.isSubmitting ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Enter the OTP sent to <span className="font-medium">{phoneNumber}</span>
              </p>
            </div>
            
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel>One-Time Password (OTP)</FormLabel>
                  <FormControl>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col space-y-2">
              <Button type="submit" disabled={otpForm.formState.isSubmitting} className="w-full">
                {otpForm.formState.isSubmitting ? "Verifying..." : "Verify & Login"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("phone")}
                className="text-sm w-full"
              >
                Back to phone number
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
