
import { supabase } from "@/lib/supabase";

// Function to create a worker notification
export async function createWorkerNotification(
  workerId: string,
  message: string,
  type: string = "info",
  actionRequired: boolean = false
) {
  try {
    console.log(`Creating worker notification for worker ${workerId}`);
    
    const notification = {
      worker_id: workerId,
      type,
      message,
      status: "unread",
      created_at: new Date().toISOString(),
      action_required: actionRequired,
      action_type: actionRequired ? "acknowledge" : undefined
    };
    
    const { data, error } = await supabase
      .from('worker_notifications')
      .insert([notification])
      .select();
      
    if (error) {
      console.error("Error creating worker notification:", error);
      return { success: false, error };
    }
    
    console.log("Worker notification created:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Exception creating worker notification:", error);
    return { success: false, error };
  }
}

// Function to create a worker assignment notification
export async function createWorkerAssignmentNotification(
  workerId: string,
  businessId: string,
  businessName: string,
  jobId: string,
  jobDescription: string
) {
  try {
    // First create the assignment record
    const assignment = {
      worker_id: workerId,
      business_id: businessId,
      business_name: businessName,
      job_id: jobId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      job_description: jobDescription
    };
    
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('worker_assignments')
      .insert([assignment])
      .select();
      
    if (assignmentError) {
      console.error("Error creating worker assignment:", assignmentError);
      return { success: false, error: assignmentError };
    }
    
    // Then create the notification for the worker
    const notification = {
      worker_id: workerId,
      job_id: assignmentData[0].id,
      type: "assignment",
      message: `You have a new job assignment from ${businessName}`,
      status: "unread",
      created_at: new Date().toISOString(),
      action_required: true,
      action_type: "accept_decline"
    };
    
    const { data: notificationData, error: notificationError } = await supabase
      .from('worker_notifications')
      .insert([notification])
      .select();
      
    if (notificationError) {
      console.error("Error creating worker notification:", notificationError);
      return { success: false, error: notificationError };
    }
    
    return {
      success: true,
      data: {
        assignment: assignmentData[0],
        notification: notificationData[0]
      }
    };
  } catch (error) {
    console.error("Exception creating worker assignment notification:", error);
    return { success: false, error };
  }
}

// Function to check if worker notifications are working
export async function verifyWorkerNotificationsSystem(workerId: string) {
  try {
    // Check if the worker exists
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .single();
      
    if (workerError) {
      console.error("Error verifying worker:", workerError);
      return {
        success: false,
        error: workerError,
        message: "Failed to verify worker"
      };
    }
    
    if (!worker) {
      return {
        success: false,
        message: "Worker not found"
      };
    }
    
    // Check existing notifications
    const { count, error: countError } = await supabase
      .from('worker_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('worker_id', workerId);
      
    if (countError) {
      console.error("Error checking notifications:", countError);
      return {
        success: false,
        error: countError,
        message: "Failed to check existing notifications"
      };
    }
    
    // Create a test notification
    const testMessage = `This is a test notification. Current time: ${new Date().toLocaleTimeString()}`;
    const { success, error } = await createWorkerNotification(
      workerId,
      testMessage,
      "system_test",
      false
    );
    
    if (!success) {
      return {
        success: false,
        error,
        message: "Failed to create test notification"
      };
    }
    
    return {
      success: true,
      message: "Notification system is working",
      existingNotifications: count || 0,
      worker: {
        id: worker.id,
        name: worker.name
      }
    };
  } catch (error) {
    console.error("Exception verifying worker notifications system:", error);
    return {
      success: false,
      error,
      message: "Exception occurred during verification"
    };
  }
}
