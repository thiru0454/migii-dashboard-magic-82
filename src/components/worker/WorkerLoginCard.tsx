
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerLoginForm } from "@/components/forms/WorkerLoginForm";

interface WorkerLoginCardProps {
  onSuccess: () => void;
}

export function WorkerLoginCard({ onSuccess }: WorkerLoginCardProps) {
  return (
    <div className="flex items-center justify-center w-full py-8">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Worker Login</CardTitle>
          <CardDescription className="mt-2">
            Enter your phone number to receive an OTP via SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkerLoginForm onSuccess={onSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
