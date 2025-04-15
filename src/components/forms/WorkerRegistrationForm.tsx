
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Define the skills and states options
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
  aadhaar: z.string().optional(),
});

interface WorkerRegistrationFormProps {
  onSuccess?: (data: z.infer<typeof formSchema> & { workerId: string }) => void;
}

export function WorkerRegistrationForm({ onSuccess }: WorkerRegistrationFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
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
      // In a real application, this would be a server call
      // For demo purposes, we'll generate a fake ID
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const workerId = `TN-MIG-${dateStr}-${randomNum}`;
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Worker registered successfully!", {
        description: `Worker ID: ${workerId}`,
      });
      
      if (onSuccess) {
        onSuccess({ ...values, workerId });
      }
    } catch (error) {
      toast.error("Failed to register worker", {
        description: "Please try again later",
      });
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          <FormField
            control={form.control}
            name="aadhaar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Aadhaar Number <span className="text-muted-foreground">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="XXXX XXXX XXXX" {...field} />
                </FormControl>
                <FormDescription>
                  This is optional and will be kept confidential.
                </FormDescription>
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
