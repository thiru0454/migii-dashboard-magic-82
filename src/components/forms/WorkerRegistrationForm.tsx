
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
<<<<<<< HEAD
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MapPin } from "lucide-react";
import { registerWorkerInStorage } from "@/utils/firebase";

const SKILLS = ["Construction Worker", "Plumber", "Electrician", "Carpenter", "Painter", "Gardener", "Driver", "Cleaner", "Cook", "Other"];
const STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(18, { message: "Worker must be at least 18 years old." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  originState: z.string({ required_error: "Please select your origin state." }),
  skill: z.string({ required_error: "Please select your primary skill." }),
  aadhaar: z.string().min(12, { message: "Aadhaar number must be 12 digits." }).max(12, { message: "Aadhaar number must be 12 digits." }).regex(/^\d+$/, { message: "Aadhaar number must contain only digits." }),
=======
import { registerWorkerInStorage } from "@/utils/firebase";
import { MigrantWorker } from "@/types/worker";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  age: z.string().transform(val => parseInt(val, 10)).refine((val) => val >= 18 && val <= 100, "Age must be between 18 and 100"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits."),
  email: z.string().email().optional().or(z.literal("")),
  originState: z.string().min(1, "Please select your origin state"),
  skill: z.string().min(1, "Please select your skill"),
  aadhaar: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits."),
>>>>>>> 7ced357b9f9b45b9bba7dffc1b78bfe5b0923c30
});

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttarakhand",
  "Uttar Pradesh", "West Bengal"
];

const skills = [
  "Masonry", "Carpentry", "Plumbing", "Electrical", "Painting", "Welding", "Machine Operator",
  "Driver", "Construction Labor", "Cleaning", "Security", "Gardening", "Factory Worker", "Other"
];

export function WorkerRegistrationForm() {
  const { getLocation, location, locationError } = useGeolocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: "",
      phone: "",
      email: "",
      originState: "",
      skill: "",
      aadhaar: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await getLocation();
      
      const workerData: MigrantWorker = {
        name: values.name,
        age: values.age,
        phone: values.phone,
        email: values.email || undefined,
        originState: values.originState,
        skill: values.skill,
        aadhaar: values.aadhaar,
        photoUrl,
        latitude: location.latitude,
        longitude: location.longitude,
        id: `worker_${Date.now()}`,
        status: "pending", // This is correctly typed as literal "pending" which matches MigrantWorker type
        registrationDate: new Date().toISOString()
      };

<<<<<<< HEAD
      // Register worker directly without OTP verification
      const registeredWorker = await registerWorkerInStorage(workerData);
      
      if (onSuccess) {
        onSuccess(registeredWorker);
      }
      
      form.reset();
      setPhotoPreview(null);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error?.message || "Registration failed. Please try again.");
=======
      await registerWorkerInStorage(workerData);
      toast.success("Registration successful!");
      form.reset();
      setPhotoUrl(undefined);
    } catch (error) {
      console.error("Registration error:", error);
>>>>>>> 7ced357b9f9b45b9bba7dffc1b78bfe5b0923c30
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
<<<<<<< HEAD
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="age" render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl><Input placeholder="9876543210" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl><Input type="email" placeholder="worker@example.com" {...field} /></FormControl>
              <FormDescription>Used for communication and OTP verification</FormDescription>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="aadhaar" render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhaar Number <span className="text-red-500">*</span></FormLabel>
              <FormControl><Input placeholder="123456789012" {...field} /></FormControl>
              <FormDescription>Required for verification. Will be kept confidential.</FormDescription>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="originState" render={({ field }) => (
            <FormItem>
              <FormLabel>Origin State</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
=======
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Worker Registration</h1>
        <p className="text-gray-500 dark:text-gray-400">Enter your details to register as a migrant worker</p>
      </div>

      {locationError && (
        <Alert variant="destructive">
          <AlertTitle>Location Error</AlertTitle>
          <AlertDescription>
            We need your location to register you. Please allow location access.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
>>>>>>> 7ced357b9f9b45b9bba7dffc1b78bfe5b0923c30
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
<<<<<<< HEAD
                <SelectContent>
                  {STATES.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="skill" render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Skill</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
=======
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
>>>>>>> 7ced357b9f9b45b9bba7dffc1b78bfe5b0923c30
                <FormControl>
                  <Input type="number" placeholder="Enter your age" {...field} />
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
                  <Input type="tel" placeholder="10-digit phone number" {...field} />
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
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com (optional)" {...field} />
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
                      <SelectValue placeholder="Select your home state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {states.map((state) => (
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
                    {skills.map((skill) => (
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
                <FormLabel>Aadhaar Number</FormLabel>
                <FormControl>
                  <Input placeholder="12-digit Aadhaar number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Photo (Optional)</FormLabel>
            <Input type="file" accept="image/*" onChange={handlePhotoChange} />
          </div>
<<<<<<< HEAD
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register Worker"}
        </Button>
        <div className="text-center text-sm text-muted-foreground mt-2">
          Registration typically completes in 2-3 seconds
        </div>
      </form>
    </Form>
=======

          {photoUrl && (
            <div className="flex justify-center">
              <img src={photoUrl} alt="Preview" className="max-h-40 object-cover rounded-md" />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || Boolean(locationError)}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </form>
      </Form>
    </div>
>>>>>>> 7ced357b9f9b45b9bba7dffc1b78bfe5b0923c30
  );
}
