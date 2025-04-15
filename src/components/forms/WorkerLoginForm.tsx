
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

const loginSchema = z.object({
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
});

const otpSchema = z.object({
  otp: z.string().min(4, {
    message: "OTP must be at least 4 digits.",
  }),
});

interface WorkerLoginFormProps {
  onSuccess?: () => void;
}

export function WorkerLoginForm({ onSuccess }: WorkerLoginFormProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  
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
      // In a real application, this would send an SMS with OTP
      // For demo purposes, we'll just move to the next step
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setPhoneNumber(values.phone);
      setStep("otp");
      toast.success("OTP sent successfully!", {
        description: `A verification code has been sent to ${values.phone}`,
      });
    } catch (error) {
      toast.error("Failed to send OTP", {
        description: "Please try again later",
      });
    }
  };

  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    try {
      // In a real application, this would verify the OTP
      // For demo purposes, we'll just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Login successful!", {
        description: "You have been logged in successfully",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to verify OTP", {
        description: "Please try again with correct OTP",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto">
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
                <FormItem>
                  <FormLabel>One-Time Password (OTP)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the OTP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col space-y-2">
              <Button type="submit" disabled={otpForm.formState.isSubmitting}>
                {otpForm.formState.isSubmitting ? "Verifying..." : "Verify & Login"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("phone")}
                className="text-sm"
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
