import { supabase } from "@/lib/supabase";
import { sendRegistrationEmail, sendJobNotificationEmail, sendJobApplicationConfirmation, sendJobApplicationNotificationToBusiness } from "@/utils/emailService";
import { MigrantWorker } from "@/types/worker";

// Email service for worker registration
export const sendWorkerRegistrationEmail = async (worker: MigrantWorker): Promise<boolean> => {
  try {
    return await sendRegistrationEmail(worker);
  } catch (error) {
    console.error("Error in worker registration email service:", error);
    return false;
  }
};

// Email service for job posting notifications
export const sendJobPostingNotifications = async (
  job: {
    id: string;
    title: string;
    company: string;
    location?: string;
    description: string;
    salary?: string;
    category?: string;
  },
  skillFilter?: string
): Promise<boolean> => {
  try {
    // Find workers with matching skills
    let query = supabase.from('workers').select('id, name, email, skill, "Primary Skill"');
    
    // Add skill filter if provided
    if (skillFilter) {
      query = query.or(`skill.ilike.%${skillFilter}%,skill.eq.${skillFilter},"Primary Skill".ilike.%${skillFilter}%,"Primary Skill".eq.${skillFilter}`);
    }
    
    // Only active workers
    query = query.eq('status', 'active');
    
    const { data: workers, error } = await query;
    
    if (error) {
      console.error("Error fetching workers for job notification:", error);
      return false;
    }
    
    if (!workers || workers.length === 0) {
      console.log("No matching workers found for job notification");
      return false;
    }
    
    // Format recipients
    const recipients = workers.map(worker => ({
      id: worker.id,
      name: worker.name,
      email: worker.email
    }));
    
    // Send notifications
    return await sendJobNotificationEmail(job, recipients);
  } catch (error) {
    console.error("Error in job posting notification service:", error);
    return false;
  }
};

// Email service for job application confirmation
export const sendApplicationConfirmationEmail = async (
  workerId: string,
  jobId: string
): Promise<boolean> => {
  try {
    // Get worker details
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, name, email')
      .eq('id', workerId)
      .single();
      
    if (workerError || !worker) {
      console.error("Error fetching worker for application confirmation:", workerError);
      return false;
    }
    
    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, business_id')
      .eq('id', jobId)
      .single();
      
    if (jobError || !job) {
      console.error("Error fetching job for application confirmation:", jobError);
      return false;
    }
    
    // Send confirmation to worker
    const workerEmailSent = await sendJobApplicationConfirmation(
      { id: worker.id, name: worker.name, email: worker.email },
      { id: job.id, title: job.title, company: job.company }
    );
    
    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, email')
      .eq('id', job.business_id)
      .single();
      
    if (!businessError && business) {
      // Send notification to business
      await sendJobApplicationNotificationToBusiness(
        { id: business.id, name: business.name, email: business.email },
        { id: worker.id, name: worker.name },
        { id: job.id, title: job.title }
      );
    }
    
    return workerEmailSent;
  } catch (error) {
    console.error("Error in application confirmation email service:", error);
    return false;
  }
};

// Email service for worker assignment notification
export const sendWorkerAssignmentEmail = async (
  workerId: string,
  businessId: string,
  assignmentDetails?: {
    jobDescription?: string;
    location?: string;
    duration?: string;
  }
): Promise<boolean> => {
  try {
    // Get worker details
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, name, email')
      .eq('id', workerId)
      .single();
      
    if (workerError || !worker || !worker.email) {
      console.error("Error fetching worker for assignment notification:", workerError);
      return false;
    }
    
    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, email')
      .eq('id', businessId)
      .single();
      
    if (businessError || !business) {
      console.error("Error fetching business for assignment notification:", businessError);
      return false;
    }
    
    // Create email content
    const subject = `New Work Assignment: ${business.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
        <h3 style="text-align: center;">New Work Assignment</h3>
        <p>Hello ${worker.name},</p>
        <p>You have been assigned to work with ${business.name}.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Business:</strong> ${business.name}</p>
          ${assignmentDetails?.jobDescription ? `<p style="margin: 5px 0;"><strong>Job Description:</strong> ${assignmentDetails.jobDescription}</p>` : ''}
          ${assignmentDetails?.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${assignmentDetails.location}</p>` : ''}
          ${assignmentDetails?.duration ? `<p style="margin: 5px 0;"><strong>Duration:</strong> ${assignmentDetails.duration}</p>` : ''}
        </div>
        <p>Please log in to your account to accept or decline this assignment.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/worker-login" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Respond</a>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
          If you have any questions or need assistance, please contact our support team.
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
          &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
        </p>
      </div>
    `;
    
    // Send email
    const success = await sendEmail(worker.email, subject, html);
    
    if (success) {
      // Log the email in Supabase
      await supabase.from('email_logs').insert([
        {
          recipient: worker.email,
          subject: subject,
          type: 'worker_assignment',
          worker_id: worker.id,
          business_id: business.id,
          sent_at: new Date().toISOString(),
          status: 'sent'
        }
      ]);
    }
    
    return success;
  } catch (error) {
    console.error("Error in worker assignment email service:", error);
    return false;
  }
};

// Function to send email using EmailJS or a similar service
const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    // For development/demo, log the email content
    console.log(`[Email Service] To: ${to}, Subject: ${subject}`);
    console.log(`[Email Service] Content: ${html}`);
    
    // In a real app, we would use a service like EmailJS, SendGrid, etc.
    // For now, we'll simulate success and store in Supabase for tracking
    
    // Store email in Supabase for tracking
    const { error } = await supabase
      .from('email_logs')
      .insert([
        {
          recipient: to,
          subject: subject,
          content: html,
          sent_at: new Date().toISOString(),
          status: 'sent'
        }
      ]);
      
    if (error) {
      console.error("Error logging email:", error);
      // Continue anyway since this is just logging
    }
    
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};