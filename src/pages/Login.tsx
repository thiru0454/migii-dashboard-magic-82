
import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, UserType } from "@/contexts/AuthContext";

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
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the tab from URL parameter or default to admin
  const defaultTab = searchParams.get("tab") === "business" ? "business" : "admin";
  const [activeTab, setActiveTab] = useState<UserType>(defaultTab as UserType);

  // Get the from location state for redirection after login
  const from = location.state?.from?.pathname || getDefaultRedirectPath(activeTab);

  function getDefaultRedirectPath(userType: UserType) {
    switch (userType) {
      case "admin": return "/admin-dashboard";
      case "business": return "/business-dashboard";
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
      const success = await login(values.email, values.password, activeTab);
      if (success) {
        // Get the appropriate redirect path based on user type
        const redirectPath = getDefaultRedirectPath(activeTab);
        navigate(redirectPath);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as UserType);
  };

  return (
    <div className="container flex h-screen w-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Login to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={defaultTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
            </TabsList>
            <TabsContent value="admin">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@migii.com" {...field} />
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
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login as Admin"}
                  </Button>
                </form>
              </Form>
              <div className="mt-4 text-center text-xs text-muted-foreground border-t pt-4">
                <p>For demo purposes, use:</p>
                <p>Email: admin@migii.com</p>
                <p>Password: admin123</p>
              </div>
            </TabsContent>
            <TabsContent value="business">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="business@example.com" {...field} />
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
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login as Business"}
                  </Button>
                </form>
              </Form>
              <div className="mt-4 text-center text-xs text-muted-foreground border-t pt-4">
                <p>For demo purposes, use:</p>
                <p>Email: business@example.com</p>
                <p>Password: business123</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
