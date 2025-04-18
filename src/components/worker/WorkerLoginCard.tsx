
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerLoginForm } from "@/components/forms/WorkerLoginForm";

interface WorkerLoginCardProps {
  onSuccess: () => void;
}

export function WorkerLoginCard({ onSuccess }: WorkerLoginCardProps) {
  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-200px)] py-8">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary">Worker Login</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your phone number to receive an OTP via SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <WorkerLoginForm onSuccess={onSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
