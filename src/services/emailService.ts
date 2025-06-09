import { supabase } from "@/lib/supabase";
import { sendOtpEmail, sendRegistrationEmail, sendJobNotificationEmail, sendJobApplicationConfirmation, sendJobApplicationNotificationToBusiness } from "@/utils/emailService";
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
    const recipients = workers
      .filter(worker => worker.email) // Only include workers with email
      .map(worker => ({
        name: worker.name,
        email: worker.email
      }));
    
    if (recipients.length === 0) {
      console.log("No workers with email addresses found");
      return false;
    }
    
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
      
    if (workerError || !worker || !worker.email) {
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
      { name: worker.name, email: worker.email },
      { id: job.id, title: job.title, company: job.company }
    );
    
    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, email')
      .eq('id', job.business_id)
      .single();
      
    if (!businessError && business && business.email) {
      // Send notification to business
      await sendJobApplicationNotificationToBusiness(
        { name: business.name, email: business.email },
        { id: worker.id, name: worker.name, skill: worker.skill || "Not specified" },
        { id: job.id, title: job.title }
      );
    }
    
    return workerEmailSent;
  } catch (error) {
    console.error("Error in application confirmation email service:", error);
    return false;
  }
};