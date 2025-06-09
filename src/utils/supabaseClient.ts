import { createClient } from '@supabase/supabase-js';
import { MigrantWorker } from '@/types/worker';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Worker registration
export async function registerWorker(workerData: Omit<MigrantWorker, 'id'>) {
  // Convert camelCase to snake_case for database compatibility
  const dbWorkerData = {
    name: workerData.name,
    age: workerData.age,
    phone: workerData.phone,
    email: workerData.email || null,
    aadhaar: workerData.aadhaar,
    skill: workerData.skill,
    origin_state: workerData.originState || workerData.origin_state,
    photo_url: workerData.photoUrl || workerData["Photo URL"] || null, // Use snake_case for database
    status: workerData.status || 'active',
    latitude: workerData.latitude || null,
    longitude: workerData.longitude || null,
    registration_date: workerData.registrationDate || new Date().toISOString()
  };

  return await supabase
    .from('workers')
    .insert([dbWorkerData])
    .select('*')
    .single();
}

// Get a single worker
export async function getWorker(id: string) {
  return await supabase
    .from('workers')
    .select('*')
    .eq('id', id)
    .single();
}

// Update worker details
export async function updateWorker(id: string, updates: Partial<MigrantWorker>) {
  // Convert camelCase to snake_case for database compatibility
  const dbUpdates: Record<string, any> = {};
  
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.age !== undefined) dbUpdates.age = updates.age;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.aadhaar !== undefined) dbUpdates.aadhaar = updates.aadhaar;
  if (updates.skill !== undefined) dbUpdates.skill = updates.skill;
  if (updates.originState !== undefined || updates.origin_state !== undefined) {
    dbUpdates.origin_state = updates.originState || updates.origin_state;
  }
  if (updates.photoUrl !== undefined || updates["Photo URL"] !== undefined) {
    dbUpdates.photo_url = updates.photoUrl || updates["Photo URL"];
  }
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
  if (updates.assignedBusinessId !== undefined) dbUpdates.assigned_business_id = updates.assignedBusinessId;

  return await supabase
    .from('workers')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
}

// Delete worker
export async function deleteWorker(id: string) {
  return await supabase
    .from('workers')
    .delete()
    .eq('id', id);
}

// Get all workers
export async function getAllWorkers() {
  return await supabase
    .from('workers')
    .select('*')
    .order('created_at', { ascending: false });
}

// Subscribe to workers table changes
export function subscribeToWorkers(callback: () => void) {
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
        assigned_business_id: businessId,
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
            job_id: assignmentData.id,
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
          job_id: assignmentData.id, // Use the assignment ID as the job ID
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
  return await supabase
    .from('jobs')
    .insert([{
      ...jobData,
      posted_at: new Date().toISOString()
    }])
    .select();
}

// Get all jobs
export async function getAllJobs() {
  return await supabase
    .from('jobs')
    .select('*')
    .order('posted_at', { ascending: false });
}

// Get active jobs
export async function getActiveJobs() {
  return await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .order('posted_at', { ascending: false });
}

// Get a single job
export async function getJob(id: string) {
  return await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();
}

// Update job details
export async function updateJob(id: string, updates: Partial<Job>) {
  return await supabase
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
}

// Delete job
export async function deleteJob(id: string) {
  return await supabase
    .from('jobs')
    .delete()
    .eq('id', id);
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
  return await supabase
    .from('job_applications')
    .insert([{
      ...applicationData,
      applied_at: new Date().toISOString()
    }])
    .select();
}

// Get worker's job applications
export async function getWorkerApplications(workerId: string) {
  return await supabase
    .from('job_applications')
    .select(`
      *,
      jobs:job_id (*)
    `)
    .eq('worker_id', workerId);
}

// Get applications for a job
export async function getJobApplications(jobId: string) {
  return await supabase
    .from('job_applications')
    .select(`
      *,
      workers:worker_id (*)
    `)
    .eq('job_id', jobId);
}

// Update application status
export async function updateApplicationStatus(id: string, status: string, notes?: string) {
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
}

// Submit a new support request
type SupportRequest = {
  name: string;
  email: string;
  message: string;
};

export async function submitSupportRequest(request: SupportRequest) {
  return await supabase
    .from('support_requests')
    .insert([{ ...request }])
    .select()
    .single();
}

// Fetch all support requests
export async function getSupportRequests() {
  return await supabase
    .from('support_requests')
    .select('*')
    .order('created_at', { ascending: false });
}

// Update support request status
export async function updateSupportRequestStatus(id: string, status: string) {
  return await supabase
    .from('support_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
}

// Worker notifications
export async function getWorkerNotifications(workerId: string) {
  console.log(`Fetching notifications for worker ID: ${workerId}`);
  return await supabase
    .from('worker_notifications')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });
}

export async function updateNotificationStatus(notificationId: string, status: 'read' | 'accepted' | 'declined') {
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
}

export async function markNotificationAsRead(notificationId: string) {
  return await supabase
    .from('worker_notifications')
    .update({ 
      status: 'read',
      updated_at: new Date().toISOString()
    })
    .eq('id', notificationId);
}

export async function markAllNotificationsAsRead(userId: string) {
  return await supabase
    .from('worker_notifications')
    .update({ 
      status: 'read',
      updated_at: new Date().toISOString()
    })
    .eq('worker_id', userId)
    .eq('status', 'unread');
}

// Business notifications
export async function getBusinessNotifications(businessId: string) {
  return await supabase
    .from('business_notifications')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
}

export async function markBusinessNotificationAsRead(notificationId: string) {
  return await supabase
    .from('business_notifications')
    .update({ read: true })
    .eq('id', notificationId);
}

export async function markAllBusinessNotificationsAsRead(businessId: string) {
  return await supabase
    .from('business_notifications')
    .update({ read: true })
    .eq('business_id', businessId)
    .eq('read', false);
}

// Create Supabase tables if they don't exist (helper functions for development)
export async function ensureRequiredTables() {
  const tables = [
    {
      name: 'notifications',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'user_id', type: 'uuid', isNullable: false },
        { name: 'type', type: 'text', isNullable: false },
        { name: 'message', type: 'text', isNullable: false },
        { name: 'read', type: 'boolean', defaultValue: 'false' },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'metadata', type: 'jsonb', isNullable: true },
        { name: 'response_status', type: 'text', isNullable: true },
        { name: 'response_date', type: 'timestamptz', isNullable: true }
      ]
    },
    {
      name: 'business_notifications',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'business_id', type: 'uuid', isNullable: false },
        { name: 'type', type: 'text', isNullable: false },
        { name: 'message', type: 'text', isNullable: false },
        { name: 'read', type: 'boolean', defaultValue: 'false' },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'worker_id', type: 'uuid', isNullable: true },
        { name: 'worker_name', type: 'text', isNullable: true }
      ]
    },
    {
      name: 'worker_assignments',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'worker_id', type: 'uuid', isNullable: false },
        { name: 'business_id', type: 'uuid', isNullable: false },
        { name: 'status', type: 'text', defaultValue: "'pending'" },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'job_description', type: 'text', isNullable: true },
        { name: 'skill_required', type: 'text', isNullable: true },
        { name: 'location', type: 'text', isNullable: true },
        { name: 'duration', type: 'text', isNullable: true }
      ]
    },
    {
      name: 'worker_notifications',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'worker_id', type: 'uuid', isNullable: false },
        { name: 'job_id', type: 'uuid', isNullable: true },
        { name: 'type', type: 'text', isNullable: false },
        { name: 'message', type: 'text', isNullable: false },
        { name: 'status', type: 'text', defaultValue: "'unread'" },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'action_required', type: 'boolean', defaultValue: 'false' },
        { name: 'action_type', type: 'text', isNullable: true },
        { name: 'title', type: 'text', isNullable: true }
      ]
    }
  ];
  
  // For each table, check if it exists and create it if it doesn't
  // This is a simplified version and would require Supabase admin privileges in a real app
  console.log('Database tables would be created here in a real application');
}

// Helper functions to create missing tables if needed
export async function ensureWorkerNotificationsTable() {
  console.log('Ensuring worker_notifications table exists');
  // In a real app, you would check if the table exists and create it if needed
  // For this demo, we'll assume the table exists or is created via migrations
}

export async function ensureBusinessNotificationsTable() {
  console.log('Ensuring business_notifications table exists');
  // In a real app, you would check if the table exists and create it if needed
  // For this demo, we'll assume the table exists or is created via migrations
}

// Initialize tables when the app starts
export function initializeDatabase() {
  ensureRequiredTables();
  ensureWorkerNotificationsTable();
  ensureBusinessNotificationsTable();
}