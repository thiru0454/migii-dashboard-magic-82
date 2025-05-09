import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, XCircle } from "lucide-react";

interface JobApplication {
  id: string;
  job_id: string;
  worker_id: string;
  status: string;
  created_at: string;
  worker?: {
    name: string;
    email: string;
    phone: string;
    skill: string;
    experience: string;
  };
  job?: {
    title: string;
    company: string;
    location: string;
    type: string;
    category: string;
    salary: string;
    workers_needed: number;
  };
}

export function JobApplicationsTab() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          worker:worker_id (*),
          job:job_id (*)
        `)
        .eq('job.business_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch applications: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationResponse = async (applicationId: string, response: 'accepted' | 'rejected') => {
    try {
      // Update application status
      const { error: applicationError } = await supabase
        .from('job_applications')
        .update({ status: response })
        .eq('id', applicationId);

      if (applicationError) throw applicationError;

      // Get application details
      const { data: application, error: fetchError } = await supabase
        .from('job_applications')
        .select(`
          *,
          worker:worker_id (*),
          job:job_id (*)
        `)
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      if (application) {
        // Notify worker
        const { error: notificationError } = await supabase
          .from('worker_notifications')
          .insert({
            worker_id: application.worker_id,
            job_id: application.job_id,
            type: 'application_response',
            status: 'unread',
            created_at: new Date().toISOString(),
            title: `Application ${response}`,
            message: `Your application for ${application.job?.title} has been ${response}`,
            action_required: false
          });

        if (notificationError) {
          console.error("Error creating worker notification:", notificationError);
        }

        // If accepted, update job status and worker status
        if (response === 'accepted') {
          // Update job status to 'in_progress'
          const { error: jobError } = await supabase
            .from('jobs')
            .update({ status: 'in_progress' })
            .eq('id', application.job_id);

          if (jobError) throw jobError;

          // Update worker status to 'busy'
          const { error: workerError } = await supabase
            .from('workers')
            .update({ status: 'busy' })
            .eq('id', application.worker_id);

          if (workerError) throw workerError;
        }
      }

      toast.success(`Application ${response} successfully`);
      fetchApplications();
    } catch (error: any) {
      toast.error("Failed to process application response: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No job applications yet
              </div>
            ) : (
              applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {application.job?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          From: {application.worker?.name}
                        </p>
                      </div>
                      <Badge variant={application.status === 'pending' ? 'default' : 'secondary'}>
                        {application.status}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Worker:</strong> {application.worker?.name}</p>
                        <p><strong>Email:</strong> {application.worker?.email}</p>
                        <p><strong>Phone:</strong> {application.worker?.phone}</p>
                      </div>
                      <div>
                        <p><strong>Skill:</strong> {application.worker?.skill}</p>
                        <p><strong>Experience:</strong> {application.worker?.experience}</p>
                        <p><strong>Applied:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {application.status === 'pending' && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplicationResponse(application.id, 'accepted')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplicationResponse(application.id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 