import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Worker {
  id: string;
  name: string;
  email: string;
  status: string;
  skills: string[];
  rating: number;
  completed_jobs: number;
}

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_worker_id: string | null;
  required_skills: string[];
  priority: 'low' | 'medium' | 'high';
  deadline: string;
}

export const WorkerAssignment = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    fetchWorkersAndJobs();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const workersSubscription = supabase
      .channel('workers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => {
        fetchWorkersAndJobs();
      })
      .subscribe();

    const jobsSubscription = supabase
      .channel('jobs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchWorkersAndJobs();
      })
      .subscribe();

    return () => {
      workersSubscription.unsubscribe();
      jobsSubscription.unsubscribe();
    };
  };

  const fetchWorkersAndJobs = async () => {
    try {
      // Fetch available workers with their skills and ratings
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('*, worker_skills(skill_name), worker_ratings(rating)')
        .eq('status', 'available');

      if (workersError) throw workersError;

      // Fetch unassigned jobs with required skills
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, job_skills(skill_name)')
        .is('assigned_worker_id', null);

      if (jobsError) throw jobsError;

      setWorkers(workersData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load workers and jobs');
    } finally {
      setLoading(false);
    }
  };

  const assignWorker = async (jobId: string, workerId: string) => {
    try {
      // Update job with assigned worker
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ 
          assigned_worker_id: workerId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Update worker status
      const { error: workerError } = await supabase
        .from('workers')
        .update({ 
          status: 'assigned',
          current_job_id: jobId
        })
        .eq('id', workerId);

      if (workerError) throw workerError;

      // Create notification for worker
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: workerId,
          type: 'job_assignment',
          message: `You have been assigned to job: ${jobs.find(j => j.id === jobId)?.title}`,
          read: false,
          created_at: new Date().toISOString(),
          metadata: {
            job_id: jobId,
            priority: jobs.find(j => j.id === jobId)?.priority,
            deadline: jobs.find(j => j.id === jobId)?.deadline
          }
        });

      if (notificationError) throw notificationError;

      toast.success('Worker assigned successfully');
    } catch (error) {
      console.error('Error assigning worker:', error);
      toast.error('Failed to assign worker');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredWorkers = workers.filter(worker => 
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(job => {
    const jobSkills = getJobSkills(job);
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;
    const matchesSkill = skillFilter === 'all' || jobSkills.includes(skillFilter);
    return matchesPriority && matchesSkill;
  });

  // Helper to extract skills from worker object
  const getWorkerSkills = (worker: any) => {
    if (Array.isArray(worker.skills)) return worker.skills;
    if (Array.isArray(worker.worker_skills)) return worker.worker_skills.map((s: any) => s.skill_name);
    return [];
  };

  // Helper to extract required skills from job object
  const getJobSkills = (job: any) => {
    if (Array.isArray(job.required_skills)) return job.required_skills;
    if (Array.isArray(job.job_skills)) return job.job_skills.map((s: any) => s.skill_name);
    return [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Worker Assignment</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Search workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {Array.from(new Set(jobs.flatMap(job => job.required_skills))).map(skill => (
                <SelectItem key={skill} value={skill}>{skill}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Workers */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Available Workers</h3>
          <div className="space-y-4">
            {filteredWorkers.map((worker) => (
              <div key={worker.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{worker.name}</h4>
                    <p className="text-gray-600">{worker.email}</p>
                    <div className="flex gap-2 mt-2">
                      {worker.skills.map(skill => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Rating: {worker.rating}/5</div>
                    <div className="text-sm text-gray-500">Jobs: {worker.completed_jobs}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Unassigned Jobs */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Unassigned Jobs</h3>
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const jobSkills = getJobSkills(job);
              // Debug output
              console.log('Job:', job.title, 'Skills:', jobSkills);
              const matchingWorkers = filteredWorkers.filter(worker => {
                const workerSkills = getWorkerSkills(worker);
                console.log('Worker:', worker.name, 'Skills:', workerSkills);
                // Worker must have ALL required skills for the job
                return jobSkills.length === 0 || jobSkills.every(skill => workerSkills.includes(skill));
              });
              return (
                <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{job.title}</h4>
                    <Badge className={getPriorityColor(job.priority)}>
                      {job.priority} priority
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{job.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {jobSkills.map(skill => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchingWorkers.length === 0 ? (
                      <div className="text-gray-500">No matching workers available</div>
                    ) : (
                      matchingWorkers.map((worker) => (
                        <Button
                          key={worker.id}
                          onClick={() => assignWorker(job.id, worker.id)}
                          variant="outline"
                          className="hover:bg-primary hover:text-white transition-colors"
                        >
                          Assign {worker.name}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}; 