
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Building, Clock, MapPin, Briefcase, Calendar, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  category: string;
  salary: string;
  description: string;
  requirements: string;
  contact_email: string;
  posted_at: string;
  status: string;
}

export function AvailableJobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobDetailOpen, setJobDetailOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    fetchJobs();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    // Filter jobs when search term or job type filter changes
    const filtered = jobs.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesType = !jobTypeFilter || job.job_type === jobTypeFilter;
      
      return matchesSearch && matchesType;
    });
    
    setFilteredJobs(filtered);
  }, [jobs, searchTerm, jobTypeFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('posted_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setJobs(data || []);
      setFilteredJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load available jobs');
    } finally {
      setLoading(false);
    }
  };
  
  const viewJobDetails = (job: Job) => {
    setSelectedJob(job);
    setJobDetailOpen(true);
  };
  
  const handleApplyClick = () => {
    setJobDetailOpen(false);
    setApplyDialogOpen(true);
  };
  
  const submitApplication = async () => {
    if (!selectedJob) return;
    
    setIsApplying(true);
    
    try {
      // Get current worker from localStorage
      const currentWorker = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      if (!currentWorker || !currentWorker.id) {
        toast.error('Please log in to apply for jobs');
        return;
      }
      
      // Submit job application
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: selectedJob.id,
          worker_id: currentWorker.id,
          worker_name: currentWorker.name,
          status: 'pending',
          applied_at: new Date().toISOString()
        });
        
      if (error) {
        throw error;
      }
      
      toast.success('Application submitted successfully!');
      setApplyDialogOpen(false);
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <LoadingSpinner size="lg" text="Loading available jobs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-white/50">
        <CardHeader>
          <CardTitle className="text-2xl">Available Jobs</CardTitle>
          <CardDescription>Explore job opportunities that match your skills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search jobs by title, company or location"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-gray-50">
              <p className="text-muted-foreground">No jobs found matching your criteria</p>
              <Button 
                variant="link" 
                onClick={() => {
                  setSearchTerm("");
                  setJobTypeFilter("");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-all hover-glow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            {job.company}
                          </div>
                          {job.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {job.job_type.replace('-', ' ')}
                          </Badge>
                          {job.category && (
                            <Badge variant="outline" className="flex items-center">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {job.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-start md:items-end gap-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          Posted on {formatDate(job.posted_at)}
                        </div>
                        {job.salary && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                            {job.salary}
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          className="mt-2 hover-scale"
                          onClick={() => viewJobDetails(job)}
                        >
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={jobDetailOpen} onOpenChange={setJobDetailOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedJob.title}</DialogTitle>
              <DialogDescription className="text-base font-medium">
                {selectedJob.company} • {selectedJob.location}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge className="flex items-center">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {selectedJob.job_type.replace('-', ' ')}
                </Badge>
                {selectedJob.category && (
                  <Badge variant="outline">{selectedJob.category}</Badge>
                )}
                {selectedJob.salary && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {selectedJob.salary}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-2">Job Description</h4>
                  <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
                    {selectedJob.description}
                  </div>
                </div>
                
                {selectedJob.requirements && (
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Requirements</h4>
                    <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
                      {selectedJob.requirements}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Posted on {formatDate(selectedJob.posted_at)}
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setJobDetailOpen(false)}>
                      Close
                    </Button>
                    <Button className="hover-scale" onClick={handleApplyClick}>
                      Apply Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Apply for Job Dialog */}
      {selectedJob && (
        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Apply for Job</DialogTitle>
              <DialogDescription>
                Submit your application for {selectedJob.title} at {selectedJob.company}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-center mb-4">
                Your profile information will be shared with {selectedJob.company}. 
                Click "Submit Application" to continue.
              </p>
              <div className="mt-4">
                <Button 
                  className="w-full hover-scale"
                  onClick={submitApplication}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Submitting...
                    </>
                  ) : 'Submit Application'}
                </Button>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setApplyDialogOpen(false)}
                className="w-full sm:w-auto order-1 sm:order-none"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
