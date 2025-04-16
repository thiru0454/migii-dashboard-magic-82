import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkerLoginForm } from "@/components/forms/WorkerLoginForm";
import { WorkerIDCard } from "@/components/worker/WorkerIDCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, History, FileText, Phone } from "lucide-react";

const WorkerLogin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const workerData = {
    workerId: "TN-MIG-20240101-12345",
    name: "Rahul Kumar",
    phone: "9876543210",
    skill: "Construction Worker",
    originState: "Bihar",
    status: "Active",
    supportHistory: [
      {
        id: "REQ-001",
        date: "2024-04-01",
        issue: "Accommodation request",
        status: "Pending",
      },
      {
        id: "REQ-002",
        date: "2024-03-15",
        issue: "Payment discrepancy",
        status: "Resolved",
      },
    ],
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 my-6">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight">Worker Login</h1>
          <p className="text-muted-foreground mt-2">
            Access your Migii worker dashboard
          </p>
        </div>

        {isLoggedIn ? (
          <div className="space-y-6">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="id-card">ID Card</TabsTrigger>
                <TabsTrigger value="support">Support History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dashboard" className="space-y-6">
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
              </TabsContent>
              
              <TabsContent value="id-card" className="pt-6 flex justify-center">
                <WorkerIDCard
                  workerId={workerData.workerId}
                  name={workerData.name}
                  phone={workerData.phone}
                  skill={workerData.skill}
                  originState={workerData.originState}
                />
              </TabsContent>
              
              <TabsContent value="support" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Support History</CardTitle>
                    <CardDescription>
                      Track your support requests and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {workerData.supportHistory.length > 0 ? (
                      <div className="space-y-6">
                        {workerData.supportHistory.map((item) => (
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
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full py-8">
            <Card className="w-full max-w-md mx-auto shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Worker Login</CardTitle>
                <CardDescription className="mt-2">
                  Enter your phone number to receive an OTP via SMS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkerLoginForm onSuccess={handleLoginSuccess} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkerLogin;
