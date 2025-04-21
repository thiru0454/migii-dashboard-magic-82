
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, UserType } from "@/contexts/AuthContext";
import { WorkerLoginForm } from "@/components/forms/WorkerLoginForm";
import { ShieldAlert, Building, User } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Get the tab from URL query params if available
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    return tab && ["admin", "business", "worker"].includes(tab) ? tab : "admin";
  });

  function getDefaultRedirectPath(userType: UserType | "worker") {
    switch (userType) {
      case "admin": return "/admin-dashboard";
      case "business": return "/business-dashboard";
      case "worker": return "/worker-login";
      default: return "/";
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const userType = activeTab as UserType;
      if (userType !== "worker") {
        const success = await login(values.email, values.password, userType);
        if (success) {
          navigate(getDefaultRedirectPath(userType));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkerLoginSuccess = () => {
    navigate("/worker-login");
  };

  return (
    <div className="container flex h-screen w-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Choose your account type to login</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Business
              </TabsTrigger>
              <TabsTrigger value="worker" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Worker
              </TabsTrigger>
            </TabsList>

            {(activeTab === "admin" || activeTab === "business") && (
              <TabsContent value={activeTab}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={activeTab === "admin" ? "admin@migii.com" : "buis@migii.com"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder={activeTab === "admin" ? "admin0454" : "buis0454"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : `Sign in as ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                    </Button>
                  </form>
                  <div className="mt-4 text-center text-xs text-muted-foreground border-t pt-4">
                    <p>For demo purposes, use:</p>
                    {activeTab === "admin" ? (
                      <>
                        <p>Email: admin@migii.com</p>
                        <p>Password: admin0454</p>
                      </>
                    ) : (
                      <>
                        <p>Email: buis@migii.com</p>
                        <p>Password: buis0454</p>
                      </>
                    )}
                  </div>
                </Form>
              </TabsContent>
            )}

            <TabsContent value="worker">
              <WorkerLoginForm onSuccess={handleWorkerLoginSuccess} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
