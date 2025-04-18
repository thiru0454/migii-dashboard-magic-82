
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SignIn } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

// Schema for admin login
const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Schema for business user login
const businessLoginSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  password: z.string().min(1, "Password is required"),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<"worker" | "admin" | "business">(
    tabParam === "admin" ? "admin" : 
    tabParam === "business" ? "business" : 
    tabParam === "worker" ? "worker" : 
    "admin" // Default to admin if no valid tab param
  );

    // Admin login form
    const adminForm = useForm<z.infer<typeof adminLoginSchema>>({
      resolver: zodResolver(adminLoginSchema),
      defaultValues: {
        username: "",
        password: "",
      },
    });

  // Business login form
  const businessForm = useForm<z.infer<typeof businessLoginSchema>>({
    resolver: zodResolver(businessLoginSchema),
    defaultValues: {
      businessId: "", // Set default business ID
      password: "", // Password remains empty for security
    },
  });

  useEffect(() => {
    // Update the active tab when the URL parameter changes
    if (tabParam === "admin" || tabParam === "business" || tabParam === "worker") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const onAdminSubmit = async (values: z.infer<typeof adminLoginSchema>) => {
    // Check if credentials match the hardcoded admin credentials
    if (values.username === "admin123" && values.password === "admin0454") {
      try {
        // Store admin auth status in localStorage
        localStorage.setItem("isAdmin", "true");
        toast.success("Admin login successful");
        
        // Force a small delay to ensure localStorage is set before navigation
        setTimeout(() => {
          navigate("/admin-dashboard");
        }, 100);
      } catch (error) {
        console.error("Navigation error:", error);
        toast.error("Error during login redirection");
      }
    } else {
      toast.error("Invalid admin credentials");
    }
  };

  const onBusinessSubmit = (values: z.infer<typeof businessLoginSchema>) => {
    // Check credentials against the new hardcoded values
    if (values.businessId === "buiss123" && values.password === "buiss0454") {
      // Find or create a default business user
      const businessUsers = JSON.parse(localStorage.getItem("businessUsers") || "[]");
      let businessUser = businessUsers.find((user: any) => user.businessId === "buiss123");
      
      if (!businessUser) {
        // Create a default business user if not exists
        businessUser = {
          id: 'b_default',
          businessId: "buiss123",
          password: "buis0454",
          name: "Default Business",
          email: "default@business.com",
          phone: "+1 555-123-4567",
          registrationDate: new Date().toISOString(),
          status: 'active'
        };
        businessUsers.push(businessUser);
        localStorage.setItem("businessUsers", JSON.stringify(businessUsers));
      }

      // Store business user and set login status
      localStorage.setItem("businessUser", JSON.stringify(businessUser));
      toast.success("Business login successful");
      navigate("/business-dashboard");
    } else {
      toast.error("Invalid business credentials");
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Access the Migii dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                  <TabsTrigger value="business">Business</TabsTrigger>
                  <TabsTrigger value="worker">Worker</TabsTrigger>
                </TabsList>
                
                <TabsContent value="admin" className="mt-6">
                  <Form {...adminForm}>
                    <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                      <FormField
                        control={adminForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter admin username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adminForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">Login as Admin</Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="business" className="mt-6">
                  <Form {...businessForm}>
                    <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-4">
                      <FormField
                        control={businessForm.control}
                        name="businessId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter business ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={businessForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">Login as Business</Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="worker" className="mt-6">
                  <SignIn redirectUrl="/worker-dashboard" />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-muted-foreground">
              Select the appropriate login method for your role
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Login;
