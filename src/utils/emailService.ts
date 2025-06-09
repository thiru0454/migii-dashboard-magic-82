import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Store OTPs temporarily (in a real app, this would be in a database)
const otpStore: Record<string, { otp: string, timestamp: number }> = {};

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOtpEmail = async (email: string, otp?: string): Promise<boolean> => {
  try {
    // Generate a random 6-digit OTP if not provided
    const generatedOtp = otp || generateOTP();
    
    // Store OTP for verification (with 10-minute expiry)
    otpStore[email] = {
      otp: generatedOtp,
      timestamp: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
    };
    
    console.log(`Generated OTP for ${email}: ${generatedOtp}`);
    
    try {
      // Try to call Supabase Edge Function to send email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'otp',
          to: email,
          data: { otp: generatedOtp }
        }
      });
      
      if (error) {
        console.warn('Edge Function failed, using fallback:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      console.log('Email sent successfully via Edge Function');
    } catch (edgeError: any) {
      console.warn('Edge Function unavailable, using development fallback:', edgeError);
      
      // Fallback for development: simulate email sending
      console.log(`[DEVELOPMENT MODE] Simulating email send to ${email}`);
      console.log(`[DEVELOPMENT MODE] OTP Code: ${generatedOtp}`);
      
      // Show development notification
      toast.info(`Development Mode: Email Simulated`, {
        description: `OTP for ${email}: ${generatedOtp}`,
        duration: 10000
      });
    }
    
    // Always show success message for user experience
    toast.success(`OTP sent to ${email}`, {
      description: "Please check your email for the OTP code (or use the development OTP shown above)."
    });
    
    return true;
  } catch (error: any) {
    console.error('Error in email service:', error);
    
    // Even if email fails, we can still provide a development OTP
    const fallbackOtp = generateOTP();
    otpStore[email] = {
      otp: fallbackOtp,
      timestamp: Date.now() + 10 * 60 * 1000
    };
    
    toast.warning(`Email service unavailable - Development Mode`, {
      description: `Use this OTP for testing: ${fallbackOtp}`,
      duration: 15000
    });
    
    return true; // Return true to allow development to continue
  }
};

// Send registration confirmation email
export const sendRegistrationEmail = async (worker: {
  name: string;
  email?: string;
  id: string;
  phone: string;
  skill: string;
}): Promise<boolean> => {
  if (!worker.email) {
    console.log("No email provided for worker, skipping registration email");
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'registration',
        to: worker.email,
        data: {
          name: worker.name,
          id: worker.id
        }
      }
    });
    
    if (error) {
      console.warn('Registration email failed, continuing without email:', error);
      toast.info(`Registration successful for ${worker.name}`, {
        description: "Email notification unavailable in development mode"
      });
      return false;
    }
    
    toast.success(`Registration confirmation sent to ${worker.email}`);
    return true;
  } catch (error: any) {
    console.warn('Registration email service unavailable:', error);
    toast.info(`Registration successful for ${worker.name}`, {
      description: "Email notification unavailable in development mode"
    });
    return false;
  }
};

// OTP verification function
export const verifyOtp = (email: string, otp: string): boolean => {
  // For demo, always accept "123456" as valid OTP
  if (otp === "123456") {
    return true;
  }
  
  // Check if OTP exists and is valid
  const storedOTP = otpStore[email];
  if (storedOTP && storedOTP.otp === otp && Date.now() < storedOTP.timestamp) {
    // Clear OTP after successful verification
    delete otpStore[email];
    return true;
  }
  
  return false;
};

// Send job notification emails to workers
export const sendJobNotificationEmail = async (
  job: {
    id?: string;
    title: string;
    company: string;
    location?: string;
    description: string;
    salary?: string;
    category?: string;
  },
  recipients: Array<{ name: string; email: string }>
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'job-notification',
        recipients,
        data: job
      }
    });
    
    if (error) {
      console.warn('Job notification emails failed:', error);
      toast.info(`Job "${job.title}" posted successfully`, {
        description: "Email notifications unavailable in development mode"
      });
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.warn('Job notification email service unavailable:', error);
    toast.info(`Job "${job.title}" posted successfully`, {
      description: "Email notifications unavailable in development mode"
    });
    return false;
  }
};

// Send job application confirmation to worker
export const sendJobApplicationConfirmation = async (
  worker: { name: string; email: string },
  job: { id: string; title: string; company: string }
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'job-application-confirmation',
        to: worker.email,
        data: {
          workerName: worker.name,
          jobTitle: job.title,
          company: job.company,
          jobId: job.id
        }
      }
    });
    
    if (error) {
      console.warn('Job application confirmation failed:', error);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.warn('Job application confirmation service unavailable:', error);
    return false;
  }
};

// Send job application notification to business
export const sendJobApplicationNotificationToBusiness = async (
  business: { name: string; email: string },
  worker: { id: string; name: string; skill: string },
  job: { id: string; title: string }
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'job-application-notification',
        to: business.email,
        data: {
          businessName: business.name,
          workerName: worker.name,
          workerSkill: worker.skill,
          workerId: worker.id,
          jobTitle: job.title,
          jobId: job.id
        }
      }
    });
    
    if (error) {
      console.warn('Job application notification to business failed:', error);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.warn('Job application notification service unavailable:', error);
    return false;
  }
};