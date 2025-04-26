
import { Card, CardContent } from "@/components/ui/card";

export function RequestWorkersTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium">Request Workers</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This feature will allow administrators to request workers for various projects and assignments.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm">This feature is currently under development and will be available soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
