
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailableJobsTab } from "@/components/worker/AvailableJobsTab";

const ADMIN_CREDENTIALS = {
  username: "admin@migii.com",
  password: "admin123",
};

const BUSINESS_CREDENTIALS = {
  username: "business@migii.com",
  password: "business0454",
};

type LoginMode = "none" | "admin" | "business";

export default function Login() {
  const [mode, setMode] = useState<LoginMode>("none");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check for tab query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "admin") {
      setMode("admin");
    } else if (tab === "business") {
      setMode("business");
    } else if (tab === "worker") {
      navigate("/worker-login");
    } else if (tab === "jobs") {
      setActiveTab("jobs");
    }
  }, [location, navigate]);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setIsSubmitting(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await login(username.trim(), password, "admin");
      if (success) {
        navigate("/admin-dashboard");
      } else {
        toast.error("Invalid admin credentials");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBusinessLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await login(username.trim(), password, "business");
      if (success) {
        navigate("/business-dashboard");
      } else {
        toast.error("Invalid business credentials");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToWorkerLogin = () => {
    navigate("/worker-login");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-full max-w-4xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-8">
                <TabsTrigger value="login" className="text-lg py-3">Login</TabsTrigger>
                <TabsTrigger value="jobs" className="text-lg py-3">Available Jobs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="animate-fade-in">
                <div className="space-y-6 bg-card shadow-lg p-8 rounded-lg max-w-sm mx-auto">
                  <h2 className="text-2xl font-bold mb-6 text-center">MIGII Login Portal</h2>
                  {mode === "none" && (
                    <div className="space-y-4">
                      <Button className="w-full" variant="outline" onClick={() => { setMode("admin"); resetForm(); }}>
                        Admin Login
                      </Button>
                      <Button className="w-full" variant="outline" onClick={() => { setMode("business"); resetForm(); }}>
                        Business Login
                      </Button>
                      <Button className="w-full" variant="outline" onClick={goToWorkerLogin}>
                        Worker Login
                      </Button>
                    </div>
                  )}

                  {mode === "admin" && (
                    <form
                      className="space-y-6"
                      onSubmit={handleAdminLogin}
                    >
                      <h3 className="text-xl font-semibold text-center">Admin Login</h3>
                      <Input
                        type="text"
                        placeholder="Enter admin email"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <Input
                        type="password"
                        placeholder="Enter password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Sign In as Admin"}
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={() => setMode("none")}
                        disabled={isSubmitting}
                      >
                        Back to Login Options
                      </Button>
                    </form>
                  )}

                  {mode === "business" && (
                    <form
                      className="space-y-6"
                      onSubmit={handleBusinessLogin}
                    >
                      <h3 className="text-xl font-semibold text-center">Business Login</h3>
                      <Input
                        type="text"
                        placeholder="Enter business email"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <Input
                        type="password"
                        placeholder="Enter password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Sign In as Business"}
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={() => setMode("none")}
                        disabled={isSubmitting}
                      >
                        Back to Login Options
                      </Button>
                    </form>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="jobs" className="animate-fade-in">
                <AvailableJobsTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
