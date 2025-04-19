
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface WorkerLoginFormProps {
  onSuccess: () => void;
}

// Form validation schema
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
});

const OTP_LENGTH = 6;

export function WorkerLoginForm({ onSuccess }: WorkerLoginFormProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const { loginWithPhone, verifyOtp } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
    },
  });

  const onSubmitPhone = async (values: z.infer<typeof formSchema>) => {
    const formattedPhone = values.phone.startsWith("+") ? values.phone : "91" + values.phone;
    setPhone(formattedPhone);
    
    try {
      const verId = await loginWithPhone(formattedPhone);
      if (verId) {
        setVerificationId(verId);
        setStep("otp");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= OTP_LENGTH) {
      setOtp(value);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const success = await verifyOtp(verificationId, otp);
      if (success) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Failed to verify OTP. Please try again.");
    }
  };

  return (
    <>
      {step === "phone" ? (
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Send OTP
            </Button>
          </form>
        </Form>
      ) : (
        <div className="space-y-6">
          <div>
            <Label htmlFor="otp" className="block mb-2">
              Enter OTP sent to {phone}
            </Label>
            <div className="flex items-center">
              <Input
                id="otp"
                value={otp}
                onChange={handleOtpChange}
                placeholder={`Enter ${OTP_LENGTH}-digit OTP`}
                maxLength={OTP_LENGTH}
                className="text-center text-2xl tracking-widest py-2"
              />
            </div>
            <div className="text-center mt-2">
              <Button
                variant="link"
                type="button"
                className="text-xs"
                onClick={() => setStep("phone")}
              >
                Change phone number
              </Button>
            </div>
          </div>
          <Button onClick={handleVerifyOtp} className="w-full">
            Verify & Login
          </Button>
          <div className="text-center">
            <Button
              variant="link"
              type="button"
              className="text-xs"
              onClick={async () => {
                try {
                  const verId = await loginWithPhone(phone);
                  if (verId) {
                    setVerificationId(verId);
                    toast.success("OTP resent successfully!");
                  }
                } catch (error) {
                  toast.error("Failed to resend OTP");
                }
              }}
            >
              Didn't receive code? Resend OTP
            </Button>
          </div>
        </div>
      )}
      <div className="mt-4 text-center text-xs text-muted-foreground border-t pt-4">
        <p>For demo purposes, you can use any valid phone number format</p>
      </div>
    </>
  );
}
