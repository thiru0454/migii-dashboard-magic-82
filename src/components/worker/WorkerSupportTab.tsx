
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone } from "lucide-react";

interface SupportHistoryItem {
  id: string;
  date: string;
  issue: string;
  status: string;
}

export function WorkerSupportTab({ supportHistory }: { supportHistory: SupportHistoryItem[] }) {
  return (
    <div className="pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Support History</CardTitle>
          <CardDescription>
            Track your support requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supportHistory.length > 0 ? (
            <div className="space-y-6">
              {supportHistory.map((item) => (
                <div key={item.id} className="border-b pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{item.issue}</h3>
                      <p className="text-sm text-muted-foreground">Request ID: {item.id}</p>
                    </div>
                    <Badge
                      variant={item.status === "Resolved" ? "outline" : "secondary"}
                      className={item.status === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Submitted on {item.date}</p>
                  {item.status === "Pending" && (
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Phone className="h-3 w-3" />
                        Call Support
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Message
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No support history found.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-center mt-6">
        <Button className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Create New Support Request
        </Button>
      </div>
    </div>
  );
}
