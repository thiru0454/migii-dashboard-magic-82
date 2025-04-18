
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAdmin, RequireAuth, RequireBusiness } from "./contexts/AuthContext";
import Index from "./pages/Index";
import WorkerRegistration from "./pages/WorkerRegistration";
import WorkerLogin from "./pages/WorkerLogin";
import AdminDashboard from "./pages/AdminDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="migii-theme">
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/worker-registration" element={<WorkerRegistration />} />
              <Route path="/worker-login" element={<WorkerLogin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route 
                path="/admin-dashboard" 
                element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                } 
              />
              <Route 
                path="/business-dashboard" 
                element={
                  <RequireBusiness>
                    <BusinessDashboard />
                  </RequireBusiness>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
