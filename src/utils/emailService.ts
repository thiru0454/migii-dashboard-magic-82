import { supabase } from "@/lib/supabase";

// Email service utilities that work in the browser by calling Supabase Edge Functions

export const sendRegistrationEmail = async (worker: any): Promise<boolean> => {
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
      console.error('Error sending registration email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendRegistrationEmail:', error);
    return false;
  }
};

export const sendOtpEmail = async (email: string, otp: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'otp',
        to: email,
        data: { otp }
      }
    });

    if (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendOtpEmail:', error);
    return false;
  }
};

export const sendJobNotificationEmail = async (
  job: {
    id: string;
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
      console.error('Error sending job notification emails:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendJobNotificationEmail:', error);
    return false;
  }
};

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
      console.error('Error sending job application confirmation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendJobApplicationConfirmation:', error);
    return false;
  }
};

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
      console.error('Error sending job application notification to business:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendJobApplicationNotificationToBusiness:', error);
    return false;
  }
};