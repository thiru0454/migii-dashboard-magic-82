import { createClient } from '@supabase/supabase-js';
import { MigrantWorker } from '@/types/worker';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Using fallback mechanisms.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Worker registration
export async function registerWorker(workerData: Omit<MigrantWorker, 'id'>) {
  try {
    return await supabase
      .from('workers')
      .insert([workerData])
      .select('*')
      .single();
  } catch (error) {
    console.error('Error registering worker:', error);
    // Return a structured error response
    return { data: null, error: { message: 'Failed to register worker' } };
  }
}

// Get a single worker
export async function getWorker(id: string) {
  try {
    return await supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error('Error getting worker:', error);
    return { data: null, error: { message: 'Failed to get worker' } };
  }
}

// Update worker details
export async function updateWorker(id: string, updates: Partial<MigrantWorker>) {
  try {
    return await supabase
      .from('workers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  } catch (error) {
    console.error('Error updating worker:', error);
    return { data: null, error: { message: 'Failed to update worker' } };
  }
}

// Delete worker
export async function deleteWorker(id: string) {
  try {
    return await supabase
      .from('workers')
      .delete()
      .eq('id', id);
  } catch (error) {
    console.error('Error deleting worker:', error);
    return { error: { message: 'Failed to delete worker' } };
  }
}

// Get all workers
export async function getAllWorkers() {
  try {
    // First try to get from Supabase
    const result = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });
    
    // If there's an error or no data, fall back to localStorage
    if (result.error || !result.data || result.data.length === 0) {
      console.log('Falling back to localStorage for workers data');
      const storedWorkers = localStorage.getItem('workers');
      const workers = storedWorkers ? JSON.parse(storedWorkers) : [];
      return { data: workers, error: null };
    }
    
    return result;
  } catch (error) {
    console.error('Error getting all workers:', error);
    // Fall back to localStorage
    const storedWorkers = localStorage.getItem('workers');
    const workers = storedWorkers ? JSON.parse(storedWorkers) : [];
    return { data: workers, error: null };
  }
}

// Subscribe to workers table changes
export function subscribeToWorkers(callback: () => void) {
  try {
    return supabase
      .channel('workers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workers'
        },
        () => {
          callback();
        }
      )
      .subscribe();
  } catch (error) {
    console.error('Error subscribing to workers changes:', error);
    // Return a dummy subscription object
    return {
      unsubscribe: () => console.log('Dummy unsubscribe called')
    };
  }
}

// Improved function to assign worker to business
export async function assignWorkerToBusiness(workerId: string, businessId: string) {
  console.log(`Assigning worker ${workerId} to business ${businessId}`);
  
  try {
    // Get the worker data first to verify it exists
    const { data: workerData, error: getError } = await getWorker(workerId);
    
    if (getError) {
      console.error('Error fetching worker:', getError);
      throw getError;
    }
    
    if (!workerData) {
      console.error('Worker not found');
      throw new Error('Worker not found');
    }
    
    console.log('Worker found:', workerData);
    
    // Ensure worker ID is in the correct format for Supabase
    let formattedWorkerId = String(workerId);
    
    // If it's a numeric ID, we need to convert it to a valid UUID format for Supabase
    if (/^\d+$/.test(formattedWorkerId)) {
      // Generate a UUID v4 based on the worker ID
      formattedWorkerId = `00000000-0000-4000-A000-${formattedWorkerId.padStart(12, '0')}`;
      console.log("Formatted worker ID for UUID field:", formattedWorkerId);
    }
    
    // Update the worker with the business assignment
    const { data, error } = await supabase
      .from('workers')
      .update({ 
        assignedBusinessId: businessId,
        updated_at: new Date().toISOString()
      })
      .eq('id', formattedWorkerId)
      .select()
      .single();
      
    if (error) {
      console.error('Error assigning worker:', error);
      throw error;
    }
    
    // Get the business name for notifications
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single();
      
    const businessName = businessData?.name || 'Business';
    
    // Insert assignment notification for the worker
    const { data: assignmentData, error: insertError } = await supabase
      .from('worker_assignments')
      .insert([
        {
          worker_id: formattedWorkerId,
          business_id: businessId,
          business_name: businessName,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting into worker_assignments:', insertError);
    } else {
      console.log('Inserted into worker_assignments:', assignmentData);
      
      // Create a notification for the worker in the notifications table
      await supabase.from('notifications').insert([
        {
          user_id: formattedWorkerId,
          type: 'assignment',
          message: `You have been assigned to ${businessName}`,
          read: false,
          created_at: new Date().toISOString(),
          metadata: {
            business_id: businessId,
            business_name: businessName,
            job_id: assignmentData?.id,
            job_description: "New work assignment"
          },
          response_status: null,
          response_date: null
        }
      ]);
      
      // Create a notification for the worker in worker_notifications table
      await supabase.from('worker_notifications').insert([
        {
          worker_id: formattedWorkerId,
          job_id: assignmentData?.id, // Use the assignment ID as the job ID
          type: 'assignment',
          message: `You have been assigned to ${businessName}`,
          status: 'unread',
          created_at: new Date().toISOString(),
          action_required: true,
          action_type: 'accept_decline'
        }
      ]);
      
      // Also create a notification for the business
      await supabase.from('business_notifications').insert([
        {
          business_id: businessId,
          type: 'worker_assigned',
          message: `A worker has been assigned to your business`,
          worker_id: formattedWorkerId,
          worker_name: workerData.name || 'Worker',
          read: false,
          created_at: new Date().toISOString()
        }
      ]);
    }
    
    console.log('Worker successfully assigned:', data);
    return { data: assignmentData || data, error: null };
  } catch (error) {
    console.error('Exception during worker assignment:', error);
    return { data: null, error };
  }
}

// Job management functions
interface Job {
  title: string;
  company: string;
  location?: string;
  job_type: string;
  category?: string;
  salary?: string;
  description: string;
  requirements?: string;
  contact_email?: string;
  status: string;
}

// Post a new job
export async function postJob(jobData: Job) {
  try {
    return await supabase
      .from('jobs')
      .insert([{
        ...jobData,
        posted_at: new Date().toISOString()
      }])
      .select();
  } catch (error) {
    console.error('Error posting job:', error);
    return { data: null, error: { message: 'Failed to post job' } };
  }
}

// Get all jobs
export async function getAllJobs() {
  try {
    const result = await supabase
      .from('jobs')
      .select('*')
      .order('posted_at', { ascending: false });
    
    // If there's an error or no data, return mock data
    if (result.error || !result.data || result.data.length === 0) {
      console.log('Using mock job data');
      return { 
        data: [
          {
            id: '1',
            title: 'Construction Worker',
            company: 'ABC Builders',
            location: 'Mumbai',
            job_type: 'full-time',
            category: 'Construction',
            salary: '₹15,000 - ₹20,000/month',
            description: 'We need experienced construction workers for a new residential project.',
            posted_at: new Date().toISOString(),
            status: 'active'
          },
          {
            id: '2',
            title: 'Farm Helper',
            company: 'Green Farms',
            location: 'Punjab',
            job_type: 'seasonal',
            category: 'Agriculture',
            salary: '₹12,000/month',
            description: 'Seasonal work available on our farm during harvest season.',
            posted_at: new Date().toISOString(),
            status: 'active'
          }
        ], 
        error: null 
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error getting all jobs:', error);
    // Return mock data
    return { 
      data: [
        {
          id: '1',
          title: 'Construction Worker',
          company: 'ABC Builders',
          location: 'Mumbai',
          job_type: 'full-time',
          category: 'Construction',
          salary: '₹15,000 - ₹20,000/month',
          description: 'We need experienced construction workers for a new residential project.',
          posted_at: new Date().toISOString(),
          status: 'active'
        },
        {
          id: '2',
          title: 'Farm Helper',
          company: 'Green Farms',
          location: 'Punjab',
          job_type: 'seasonal',
          category: 'Agriculture',
          salary: '₹12,000/month',
          description: 'Seasonal work available on our farm during harvest season.',
          posted_at: new Date().toISOString(),
          status: 'active'
        }
      ], 
      error: null 
    };
  }
}

// Get active jobs
export async function getActiveJobs() {
  try {
    const result = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('posted_at', { ascending: false });
    
    // If there's an error or no data, return mock data
    if (result.error || !result.data || result.data.length === 0) {
      console.log('Using mock active job data');
      return { 
        data: [
          {
            id: '1',
            title: 'Construction Worker',
            company: 'ABC Builders',
            location: 'Mumbai',
            job_type: 'full-time',
            category: 'Construction',
            salary: '₹15,000 - ₹20,000/month',
            description: 'We need experienced construction workers for a new residential project.',
            posted_at: new Date().toISOString(),
            status: 'active'
          },
          {
            id: '2',
            title: 'Farm Helper',
            company: 'Green Farms',
            location: 'Punjab',
            job_type: 'seasonal',
            category: 'Agriculture',
            salary: '₹12,000/month',
            description: 'Seasonal work available on our farm during harvest season.',
            posted_at: new Date().toISOString(),
            status: 'active'
          }
        ], 
        error: null 
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error getting active jobs:', error);
    // Return mock data
    return { 
      data: [
        {
          id: '1',
          title: 'Construction Worker',
          company: 'ABC Builders',
          location: 'Mumbai',
          job_type: 'full-time',
          category: 'Construction',
          salary: '₹15,000 - ₹20,000/month',
          description: 'We need experienced construction workers for a new residential project.',
          posted_at: new Date().toISOString(),
          status: 'active'
        },
        {
          id: '2',
          title: 'Farm Helper',
          company: 'Green Farms',
          location: 'Punjab',
          job_type: 'seasonal',
          category: 'Agriculture',
          salary: '₹12,000/month',
          description: 'Seasonal work available on our farm during harvest season.',
          posted_at: new Date().toISOString(),
          status: 'active'
        }
      ], 
      error: null 
    };
  }
}

// Get a single job
export async function getJob(id: string) {
  try {
    return await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
  } catch (error) {
    console.error('Error getting job:', error);
    return { data: null, error: { message: 'Failed to get job' } };
  }
}

// Update job details
export async function updateJob(id: string, updates: Partial<Job>) {
  try {
    return await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  } catch (error) {
    console.error('Error updating job:', error);
    return { data: null, error: { message: 'Failed to update job' } };
  }
}

// Delete job
export async function deleteJob(id: string) {
  try {
    return await supabase
      .from('jobs')
      .delete()
      .eq('id', id);
  } catch (error) {
    console.error('Error deleting job:', error);
    return { error: { message: 'Failed to delete job' } };
  }
}

// Job application functions
interface JobApplication {
  job_id: string;
  worker_id: string;
  worker_name?: string;
  status: string;
  notes?: string;
}

// Submit job application
export async function submitJobApplication(applicationData: JobApplication) {
  try {
    return await supabase
      .from('job_applications')
      .insert([{
        ...applicationData,
        applied_at: new Date().toISOString()
      }])
      .select();
  } catch (error) {
    console.error('Error submitting job application:', error);
    return { data: null, error: { message: 'Failed to submit job application' } };
  }
}

// Get worker's job applications
export async function getWorkerApplications(workerId: string) {
  try {
    return await supabase
      .from('job_applications')
      .select(`
        *,
        jobs:job_id (*)
      `)
      .eq('worker_id', workerId);
  } catch (error) {
    console.error('Error getting worker applications:', error);
    return { data: null, error: { message: 'Failed to get worker applications' } };
  }
}

// Get applications for a job
export async function getJobApplications(jobId: string) {
  try {
    return await supabase
      .from('job_applications')
      .select(`
        *,
        workers:worker_id (*)
      `)
      .eq('job_id', jobId);
  } catch (error) {
    console.error('Error getting job applications:', error);
    return { data: null, error: { message: 'Failed to get job applications' } };
  }
}

// Update application status
export async function updateApplicationStatus(id: string, status: string, notes?: string) {
  try {
    return await supabase
      .from('job_applications')
      .update({ 
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
  } catch (error) {
    console.error('Error updating application status:', error);
    return { data: null, error: { message: 'Failed to update application status' } };
  }
}

// Submit a new support request
type SupportRequest = {
  name: string;
  email: string;
  message: string;
};

export async function submitSupportRequest(request: SupportRequest) {
  try {
    return await supabase
      .from('support_requests')
      .insert([{ ...request }])
      .select()
      .single();
  } catch (error) {
    console.error('Error submitting support request:', error);
    return { data: null, error: { message: 'Failed to submit support request' } };
  }
}

// Fetch all support requests
export async function getSupportRequests() {
  try {
    return await supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });
  } catch (error) {
    console.error('Error getting support requests:', error);
    return { data: null, error: { message: 'Failed to get support requests' } };
  }
}

// Update support request status
export async function updateSupportRequestStatus(id: string, status: string) {
  try {
    return await supabase
      .from('support_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
  } catch (error) {
    console.error('Error updating support request status:', error);
    return { data: null, error: { message: 'Failed to update support request status' } };
  }
}

// Worker notifications
export async function getWorkerNotifications(workerId: string) {
  try {
    console.log(`Fetching notifications for worker ID: ${workerId}`);
    return await supabase
      .from('worker_notifications')
      .select('*')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false });
  } catch (error) {
    console.error('Error getting worker notifications:', error);
    return { data: null, error: { message: 'Failed to get worker notifications' } };
  }
}

export async function updateNotificationStatus(notificationId: string, status: 'read' | 'accepted' | 'declined') {
  try {
    console.log(`Updating notification ${notificationId} status to ${status}`);
    
    // First get the notification to get the worker_id
    const { data: notificationData, error: fetchError } = await supabase
      .from('worker_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching notification:', fetchError);
      return { error: fetchError };
    }
    
    if (!notificationData) {
      console.error('No notification found with ID:', notificationId);
      return { error: new Error('Notification not found') };
    }
    
    // Now update the notification status
    const { data: notification, error: notificationError } = await supabase
      .from('worker_notifications')
      .update({ 
        status,
        action_required: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (notificationError) {
      console.error('Error updating notification:', notificationError);
      return { error: notificationError };
    }

    try {
      // Get worker info
      const { data: workerData } = await supabase
        .from('workers')
        .select('name, id')
        .eq('id', notification.worker_id)
        .single();
      
      const workerName = workerData?.name || notification.worker_name || 'Worker';
      
      // Find the related worker request based on worker_id
      const { data: requestData } = await supabase
        .from('worker_requests')
        .select('business_id, id')
        .eq('assigned_worker_id', notification.worker_id);
        
      if (requestData && requestData.length > 0) {
        const businessId = requestData[0].business_id;
        
        // Create business notification
        const businessNotification = {
          business_id: businessId,
          type: `worker_${status}`,
          message: `Worker ${workerName} has ${status} your job assignment`,
          worker_id: notification.worker_id,
          worker_name: workerName,
          read: false,
          created_at: new Date().toISOString()
        };
        
        const { error: businessNotificationError } = await supabase
          .from('business_notifications')
          .insert(businessNotification);
          
        if (businessNotificationError) {
          console.error("Error creating business notification:", businessNotificationError);
        } else {
          console.log("Created business notification about worker response:", businessNotification);
        }
        
        // Also update the request status
        const { error: requestUpdateError } = await supabase
          .from('worker_requests')
          .update({ status: status === 'declined' ? 'rejected' : status })
          .eq('id', requestData[0].id);
          
        if (requestUpdateError) {
          console.error("Error updating request status:", requestUpdateError);
        } else {
          console.log(`Updated worker request ${requestData[0].id} to status ${status}`);
        }
      } else {
        console.log("No worker request found for worker ID:", notification.worker_id);
      }
      
      // Also update the notifications table with the response
      const { data: generalNotificationData } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', notification.worker_id)
        .eq('type', 'assignment')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (generalNotificationData && generalNotificationData.length > 0) {
        await supabase
          .from('notifications')
          .update({
            response_status: status === 'read' ? null : status,
            response_date: new Date().toISOString()
          })
          .eq('id', generalNotificationData[0].id);
          
        console.log(`Updated general notification ${generalNotificationData[0].id} with response status ${status}`);
      }
    } catch (error) {
      console.error('Error handling worker notification status change:', error);
    }

    return { data: notification, error: null };
  } catch (error) {
    console.error('Error updating notification status:', error);
    return { data: null, error };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    return await supabase
      .from('worker_notifications')
      .update({ 
        status: 'read',
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { error: { message: 'Failed to mark notification as read' } };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await supabase
      .from('worker_notifications')
      .update({ 
        status: 'read',
        updated_at: new Date().toISOString()
      })
      .eq('worker_id', userId)
      .eq('status', 'unread');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { error: { message: 'Failed to mark all notifications as read' } };
  }
}

// Business notifications
export async function getBusinessNotifications(businessId: string) {
  try {
    return await supabase
      .from('business_notifications')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
  } catch (error) {
    console.error('Error getting business notifications:', error);
    return { data: null, error: { message: 'Failed to get business notifications' } };
  }
}

export async function markBusinessNotificationAsRead(notificationId: string) {
  try {
    return await supabase
      .from('business_notifications')
      .update({ read: true })
      .eq('id', notificationId);
  } catch (error) {
    console.error('Error marking business notification as read:', error);
    return { error: { message: 'Failed to mark business notification as read' } };
  }
}

export async function markAllBusinessNotificationsAsRead(businessId: string) {
  try {
    return await supabase
      .from('business_notifications')
      .update({ read: true })
      .eq('business_id', businessId)
      .eq('read', false);
  } catch (error) {
    console.error('Error marking all business notifications as read:', error);
    return { error: { message: 'Failed to mark all business notifications as read' } };
  }
}