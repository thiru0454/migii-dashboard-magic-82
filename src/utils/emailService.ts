import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { MigrantWorker } from "@/types/worker";

// Store OTPs temporarily (in a real app, this would be in a database)
const otpStore: Record<string, { otp: string, timestamp: number }> = {};

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email service configuration
const EMAIL_SERVICE_URL = import.meta.env.VITE_EMAIL_SERVICE_URL || 'https://api.emailjs.com/api/v1.0/email/send';
const EMAIL_SERVICE_USER_ID = import.meta.env.VITE_EMAIL_SERVICE_USER_ID || 'user_id';
const EMAIL_SERVICE_TEMPLATE_ID = import.meta.env.VITE_EMAIL_SERVICE_TEMPLATE_ID || 'template_id';
const EMAIL_SERVICE_ACCESS_TOKEN = import.meta.env.VITE_EMAIL_SERVICE_ACCESS_TOKEN || 'access_token';

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
    
    // Email content for OTP
    const subject = 'Your Login OTP for Migii Worker Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
        <p>Hello,</p>
        <p>Your one-time password (OTP) for login is:</p>
        <h1 style="text-align: center; letter-spacing: 5px; font-size: 32px; background-color: #f3f4f6; padding: 10px; border-radius: 5px;">${generatedOtp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
          &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
        </p>
      </div>
    `;
    
    // Send email
    const success = await sendEmail(email, subject, html);
    
    // Always show the OTP in toast for testing purposes
    toast.success(`OTP sent to ${email}. For testing, use: 123456`);
    
    return success;
  } catch (error: any) {
    console.error('Error in email service:', error);
    toast.error(`Failed to send OTP: ${error.message || error}`);
    return false;
  }
};

// Send registration confirmation email
export const sendRegistrationEmail = async (worker: MigrantWorker): Promise<boolean> => {
  if (!worker.email && !worker["Email Address"]) {
    console.log("No email provided for worker, skipping registration email");
    return false;
  }

  try {
    const email = worker.email || worker["Email Address"] || "";
    const subject = 'Welcome to Migii Worker Portal - Registration Confirmed';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
        <h3 style="text-align: center;">Registration Confirmation</h3>
        <p>Hello ${worker.name || worker["Full Name"]},</p>
        <p>Thank you for registering with Migii Worker Portal. Your registration has been successfully processed.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Worker ID:</strong> ${worker.id}</p>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${worker.name || worker["Full Name"]}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${worker.phone || worker["Phone Number"]}</p>
          <p style="margin: 5px 0;"><strong>Skill:</strong> ${worker.skill || worker["Primary Skill"] || "Not specified"}</p>
        </div>
        <p>You can now log in to the Migii Worker Portal using your phone number or email to receive jobs and access support.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/worker-login" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
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
    const success = await sendEmail(email, subject, html);
    
    if (success) {
      toast.success(`Registration confirmation sent to ${email}`);
      
      // Log the email in Supabase
      await supabase.from('email_logs').insert([
        {
          recipient: email,
          subject: subject,
          type: 'registration',
          worker_id: worker.id,
          sent_at: new Date().toISOString(),
          status: 'sent'
        }
      ]);
    } else {
      console.log(`Failed to send registration email to ${email}, but continuing with registration`);
    }
    
    return success;
  } catch (error: any) {
    console.error('Error sending registration email:', error);
    return false;
  }
};

// Send job posting notification to workers
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
  recipients: { email: string; name: string; id: string }[]
): Promise<boolean> => {
  try {
    // Filter out recipients without email
    const validRecipients = recipients.filter(r => r.email);
    
    if (validRecipients.length === 0) {
      console.log("No valid email recipients for job notification");
      return false;
    }
    
    // For each recipient, send a personalized email
    const results = await Promise.all(
      validRecipients.map(async (recipient) => {
        const subject = `New Job Opportunity: ${job.title} at ${job.company}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
            <h3 style="text-align: center;">New Job Opportunity</h3>
            <p>Hello ${recipient.name},</p>
            <p>We found a new job opportunity that matches your skills:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 5px 0; color: #4F46E5;">${job.title}</h4>
              <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company}</p>
              ${job.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>` : ''}
              ${job.salary ? `<p style="margin: 5px 0;"><strong>Salary:</strong> ${job.salary}</p>` : ''}
              ${job.category ? `<p style="margin: 5px 0;"><strong>Category:</strong> ${job.category}</p>` : ''}
              <p style="margin: 10px 0 5px;"><strong>Description:</strong></p>
              <p style="margin: 5px 0;">${job.description}</p>
            </div>
            <p>If you're interested in this opportunity, please log in to your account to apply.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/worker-login" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Apply</a>
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
        const success = await sendEmail(recipient.email, subject, html);
        
        if (success) {
          // Log the email in Supabase
          await supabase.from('email_logs').insert([
            {
              recipient: recipient.email,
              subject: subject,
              type: 'job_notification',
              worker_id: recipient.id,
              job_id: job.id,
              sent_at: new Date().toISOString(),
              status: 'sent'
            }
          ]);
        }
        
        return success;
      })
    );
    
    // Check if all emails were sent successfully
    const allSuccessful = results.every(result => result === true);
    
    if (allSuccessful) {
      toast.success(`Job notification sent to ${validRecipients.length} workers`);
    } else {
      const successCount = results.filter(result => result === true).length;
      toast.info(`Job notification sent to ${successCount} out of ${validRecipients.length} workers`);
    }
    
    return allSuccessful;
  } catch (error: any) {
    console.error('Error sending job notification emails:', error);
    toast.error(`Failed to send job notifications: ${error.message || 'Unknown error'}`);
    return false;
  }
};

// Send job application confirmation to worker
export const sendJobApplicationConfirmation = async (
  worker: { name: string; email: string; id: string },
  job: { id: string; title: string; company: string }
): Promise<boolean> => {
  if (!worker.email) {
    console.log("No email provided for worker, skipping application confirmation");
    return false;
  }

  try {
    const subject = `Application Confirmation: ${job.title} at ${job.company}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
        <h3 style="text-align: center;">Application Confirmation</h3>
        <p>Hello ${worker.name},</p>
        <p>We've received your application for the following position:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 5px 0; color: #4F46E5;">${job.title}</h4>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company}</p>
        </div>
        <p>Your application is now being reviewed. We'll notify you of any updates regarding your application status.</p>
        <p>You can check the status of your application by logging into your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/worker-login" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Check Application Status</a>
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
          type: 'application_confirmation',
          worker_id: worker.id,
          job_id: job.id,
          sent_at: new Date().toISOString(),
          status: 'sent'
        }
      ]);
    }
    
    return success;
  } catch (error: any) {
    console.error('Error sending application confirmation email:', error);
    return false;
  }
};

// Send job application notification to business
export const sendJobApplicationNotificationToBusiness = async (
  business: { name: string; email: string; id: string },
  worker: { name: string; id: string },
  job: { id: string; title: string }
): Promise<boolean> => {
  if (!business.email) {
    console.log("No email provided for business, skipping application notification");
    return false;
  }

  try {
    const subject = `New Job Application: ${job.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #8B5CF6; text-align: center;">Migii Business Portal</h2>
        <h3 style="text-align: center;">New Job Application</h3>
        <p>Hello ${business.name},</p>
        <p>You have received a new application for the following position:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 5px 0; color: #4F46E5;">${job.title}</h4>
          <p style="margin: 5px 0;"><strong>Applicant:</strong> ${worker.name}</p>
        </div>
        <p>You can review this application by logging into your business dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/login?tab=business" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Application</a>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
          If you have any questions or need assistance, please contact our support team.
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
          &copy; ${new Date().getFullYear()} Migii Business Portal. All rights reserved.
        </p>
      </div>
    `;

    // Send email
    const success = await sendEmail(business.email, subject, html);
    
    if (success) {
      // Log the email in Supabase
      await supabase.from('email_logs').insert([
        {
          recipient: business.email,
          subject: subject,
          type: 'application_notification',
          business_id: business.id,
          worker_id: worker.id,
          job_id: job.id,
          sent_at: new Date().toISOString(),
          status: 'sent'
        }
      ]);
    }
    
    return success;
  } catch (error: any) {
    console.error('Error sending application notification email to business:', error);
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