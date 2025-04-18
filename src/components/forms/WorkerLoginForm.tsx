
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

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

const OTP_LENGTH = 4;

export function WorkerLoginForm({ onSuccess }: WorkerLoginFormProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
    },
  });

  const onSubmitPhone = (values: z.infer<typeof formSchema>) => {
    setPhone(values.phone);
    
    // In a real app, this would send an SMS with the OTP
    toast.success("OTP sent successfully!", {
      description: `A 4-digit OTP has been sent to ${values.phone}`,
    });
    
    // For demo purposes, we'll use a hardcoded OTP
    setOtp("1234");
    setStep("otp");
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= OTP_LENGTH) {
      setOtp(value);
    }
  };

  const handleVerifyOtp = () => {
    // In a real app, this would verify the OTP with the server
    // For demo purposes, we'll just check if it matches our hardcoded OTP
    if (otp === "1234") {
      toast.success("OTP verified successfully!");
      onSuccess();
    } else {
      toast.error("Invalid OTP. Please try again.");
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
                placeholder="Enter 4-digit OTP"
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
              onClick={() => {
                toast.success("OTP resent successfully!");
              }}
            >
              Didn't receive code? Resend OTP
            </Button>
          </div>
        </div>
      )}
      <div className="mt-4 text-center text-xs text-muted-foreground border-t pt-4">
        <p>For demo purposes, use OTP: 1234</p>
      </div>
    </>
  );
}
