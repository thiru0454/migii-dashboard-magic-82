
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkers } from "@/hooks/useWorkers";
import { MigrantWorker } from "@/types/worker";
import { auth } from "@/utils/firebase";
import { PhoneAuthProvider, signInWithCredential, RecaptchaVerifier } from "firebase/auth";
import { toast } from "sonner";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

const SKILLS = [
  "Construction Worker",
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Gardener",
  "Driver",
  "Cleaner",
  "Cook",
  "Other",
];

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  age: z.coerce.number().min(18, {
    message: "Worker must be at least 18 years old.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  originState: z.string({
    required_error: "Please select your origin state.",
  }),
  skill: z.string({
    required_error: "Please select your primary skill.",
  }),
  aadhaar: z.string()
    .min(12, { message: "Aadhaar number must be 12 digits." })
    .max(12, { message: "Aadhaar number must be 12 digits." })
    .regex(/^\d+$/, { message: "Aadhaar number must contain only digits." }),
});

interface WorkerRegistrationFormProps {
  onSuccess?: (data: MigrantWorker) => void;
}

export function WorkerRegistrationForm({ onSuccess }: WorkerRegistrationFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { registerWorker } = useWorkers();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: undefined,
      phone: "",
      originState: "",
      skill: "",
      aadhaar: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Only include photoUrl if it exists to avoid firebase errors
      const workerData = {
        name: values.name,
        age: values.age,
        phone: values.phone,
        originState: values.originState,
        skill: values.skill,
        aadhaar: values.aadhaar,
      };
      
      // Only add the photoUrl if it exists
      if (photoPreview) {
        Object.assign(workerData, { photoUrl: photoPreview });
      }
      
      const result = await registerWorker.mutateAsync(workerData);
      
      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
            size: 'invisible',
          });
        }
        
        const phoneNumber = "+91" + values.phone;
        const provider = new PhoneAuthProvider(auth);
        const verificationId = await provider.verifyPhoneNumber(phoneNumber, window.recaptchaVerifier);
        
        const credential = PhoneAuthProvider.credential(verificationId, "123456");
        await signInWithCredential(auth, credential);
        
        toast.success("Registration SMS sent successfully!");
      } catch (error) {
        console.error("SMS sending failed:", error);
        toast.error("Could not send registration SMS");
      }

      if (onSuccess && result) {
        onSuccess(result as MigrantWorker);
      }
      
      form.reset();
      setPhotoPreview(null);
      
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    }
  };

  const compressImage = (file: File, maxSizeInMB: number = 0.5): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate the new dimensions while maintaining aspect ratio
          const maxDimension = 800; // Max dimension in pixels
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG at reduced quality to keep size small
          const quality = 0.6; // Adjust quality as needed (0.0-1.0)
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          resolve(dataUrl);
        };
        img.onerror = (error) => {
          reject(error);
        };
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Compress image to reduce size before storing
        const compressedImage = await compressImage(file);
        setPhotoPreview(compressedImage);
      } catch (error) {
        console.error("Error compressing image:", error);
        toast.error("Error processing image. Please try a smaller image.");
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div id="sign-in-button" style={{ display: 'none' }}></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="9876543210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aadhaar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Aadhaar Number <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="123456789012" {...field} />
                </FormControl>
                <FormDescription>
                  Required for verification. Will be kept confidential.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="originState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origin State</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your origin state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skill"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Skill</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your primary skill" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SKILLS.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Photo</FormLabel>
          <div className="flex flex-col items-center space-y-2">
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 w-full text-center">
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                id="worker-photo"
                onChange={handlePhotoChange}
              />
              <label
                htmlFor="worker-photo"
                className="cursor-pointer text-primary hover:text-primary/80"
              >
                {photoPreview ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded-full mb-2"
                    />
                    <span>Change photo</span>
                  </div>
                ) : (
                  <div className="py-4">
                    Click to upload photo
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Registering..." : "Register Worker"}
        </Button>
      </form>
    </Form>
  );
}
