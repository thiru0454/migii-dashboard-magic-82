
import { Card, CardContent } from "@/components/ui/card";

export function RequestStatusTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium">Request Status</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This feature will allow administrators to track the status of worker requests.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm">This feature is currently under development and will be available soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
