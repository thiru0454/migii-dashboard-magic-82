
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SignIn } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Sign in to access the Migii admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignIn redirectUrl="/admin-dashboard" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Login;
