
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BusinessUser, getAllBusinessUsers } from "@/utils/businessDatabase";
import { useWorkersContext } from "@/contexts/WorkersContext";

export function RequestWorkersTab() {
  const { workers } = useWorkersContext();
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>(getAllBusinessUsers());
  
  const [formData, setFormData] = useState({
    businessId: "",
    requiredSkills: "",
    numberOfWorkers: "1",
    description: "",
    priority: "medium",
    deadline: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get selected business details
      const selectedBusiness = businessUsers.find(b => b.id === formData.businessId);
      
      if (!selectedBusiness) {
        toast.error("Please select a valid business");
        return;
      }
      
      // Create new worker request
      const newRequest = {
        id: `req_${Date.now()}`,
        businessName: selectedBusiness.name,
        contactPerson: selectedBusiness.name,
        phone: selectedBusiness.phone,
        email: selectedBusiness.email,
        requiredSkills: formData.requiredSkills,
        numberOfWorkers: parseInt(formData.numberOfWorkers),
        description: formData.description,
        priority: formData.priority,
        deadline: formData.deadline,
        status: "pending" as "pending" | "approved" | "rejected",
        createdAt: new Date().toISOString(),
      };
      
      // Save to localStorage
      const existingRequests = JSON.parse(localStorage.getItem('workerRequests') || '[]');
      localStorage.setItem('workerRequests', JSON.stringify([...existingRequests, newRequest]));
      
      // Reset form
      setFormData({
        businessId: "",
        requiredSkills: "",
        numberOfWorkers: "1",
        description: "",
        priority: "medium",
        deadline: ""
      });
      
      toast.success("Worker request created successfully!");
    } catch (error) {
      console.error("Error creating worker request:", error);
      toast.error("Failed to create worker request");
    }
  };

  const availableWorkers = workers.filter(worker => worker.status === "approved" || worker.status === "active");
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Request Workers for Business</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessId">Business</Label>
                <Select 
                  value={formData.businessId} 
                  onValueChange={(value) => handleSelectChange("businessId", value)}
                  required
                >
                  <SelectTrigger id="businessId">
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessUsers.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requiredSkills">Required Skills</Label>
                <Input
                  id="requiredSkills"
                  name="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={handleInputChange}
                  placeholder="e.g. Masonry, Carpentry"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberOfWorkers">Number of Workers</Label>
                <Input
                  id="numberOfWorkers"
                  name="numberOfWorkers"
                  type="number"
                  min="1"
                  value={formData.numberOfWorkers}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the job requirements and details"
                rows={4}
                required
              />
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium">Available Workers: {availableWorkers.length}</h4>
                  <p className="text-xs text-muted-foreground">
                    {availableWorkers.length > 0 ? 
                      "Workers matching the selected skills will be suggested" : 
                      "No approved workers are currently available"
                    }
                  </p>
                </div>
                <Button type="submit">Create Request</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
