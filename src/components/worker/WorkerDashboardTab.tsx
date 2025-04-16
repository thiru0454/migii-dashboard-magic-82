
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkerData {
  workerId: string;
  name: string;
  phone: string;
  skill: string;
  originState: string;
  status: string;
  supportHistory: {
    id: string;
    date: string;
    issue: string;
    status: string;
  }[];
}

export function WorkerDashboardTab({ workerData }: { workerData: WorkerData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Worker ID
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">{workerData.workerId}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status
            </CardTitle>
            <Badge className="bg-green-500">{workerData.status}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Your account is active</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Support
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {workerData.supportHistory.filter(h => h.status === "Pending").length} pending requests
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Worker Information</CardTitle>
          <CardDescription>
            Your personal and work details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p>{workerData.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
              <p>{workerData.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Skill</h3>
              <p>{workerData.skill}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Origin State</h3>
              <p>{workerData.originState}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Support History</CardTitle>
            <CardDescription>
              Your recent support requests
            </CardDescription>
          </div>
          <History className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workerData.supportHistory.map((item) => (
              <div key={item.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{item.issue}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <Badge
                  variant={item.status === "Resolved" ? "outline" : "secondary"}
                  className={item.status === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""}
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button variant="outline" className="gap-2" asChild>
          <a href="#">
            <MessageSquare className="h-4 w-4" />
            Create Support Request
          </a>
        </Button>
      </div>
    </div>
  );
}
