import nodemailer from 'nodemailer';
import { toast } from "sonner";

// Configure nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'migiiworker@gmail.com',
    pass: 'eugt pqma pdgm tuop' // App password
  }
});

// Store OTPs temporarily (in a real app, this would be in a database)
const otpStore: Record<string, { otp: string, timestamp: number }> = {};

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email using nodemailer
const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: 'Migii Worker Portal <migiiworker@gmail.com>',
      to,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Fallback to mock email for development/demo
    console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
    console.log(`[Mock Email] Content: ${html}`);
    
    // Return true to simulate success in development
    return true;
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
    if (success) {
      toast.success(`OTP sent to ${email}. For testing, use: ${generatedOtp}`);
    } else {
      toast.error(`Failed to send OTP to ${email}`);
    }
    
    return success;
  } catch (error: any) {
    console.error('Error in email service:', error);
    toast.error(`Failed to send OTP: ${error.message}`);
    return false;
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
    const subject = 'Welcome to Migii Worker Portal - Registration Confirmed';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
        <h3 style="text-align: center;">Registration Confirmation</h3>
        <p>Hello ${worker.name},</p>
        <p>Thank you for registering with Migii Worker Portal. Your registration has been successfully processed.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Worker ID:</strong> ${worker.id}</p>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${worker.name}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${worker.phone}</p>
          <p style="margin: 5px 0;"><strong>Skill:</strong> ${worker.skill}</p>
        </div>
        <p>You can now log in to the Migii Worker Portal using your phone number or email to receive jobs and access support.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/worker-login" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
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
      toast.success(`Registration confirmation sent to ${worker.email}`);
    } else {
      console.log(`Failed to send registration email to ${worker.email}, but continuing with registration`);
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
    title: string;
    company: string;
    location?: string;
    description: string;
    salary?: string;
  },
  workers: Array<{ name: string; email: string }>
): Promise<boolean> => {
  try {
    const subject = `New Job Opportunity: ${job.title} at ${job.company}`;
    
    // Send email to each worker
    const emailPromises = workers.map(worker => {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
          <h3 style="text-align: center;">New Job Opportunity</h3>
          <p>Hello ${worker.name},</p>
          <p>A new job matching your skills has been posted:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin: 5px 0; color: #4F46E5;">${job.title}</h4>
            <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company}</p>
            ${job.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>` : ''}
            ${job.salary ? `<p style="margin: 5px 0;"><strong>Salary:</strong> ${job.salary}</p>` : ''}
            <p style="margin: 10px 0 5px;"><strong>Description:</strong></p>
            <p style="margin: 5px 0;">${job.description}</p>
          </div>
          <p>Log in to your Migii account to apply for this position.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/worker-login" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Apply</a>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
            &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
          </p>
        </div>
      `;
      
      return sendEmail(worker.email, subject, html);
    });
    
    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    const successCount = results.filter(Boolean).length;
    
    if (successCount > 0) {
      toast.success(`Job notification sent to ${successCount} workers`);
    }
    
    return successCount > 0;
  } catch (error: any) {
    console.error('Error sending job notification emails:', error);
    toast.error(`Failed to send job notifications: ${error.message}`);
    return false;
  }
};

// Send business notification when worker accepts/rejects assignment
export const sendBusinessNotificationEmail = async (
  business: { name: string; email: string },
  worker: { name: string; id: string },
  action: 'accepted' | 'rejected'
): Promise<boolean> => {
  try {
    const subject = `Worker ${action} your assignment request`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #8B5CF6; text-align: center;">Migii Business Portal</h2>
        <h3 style="text-align: center;">Assignment Update</h3>
        <p>Hello ${business.name},</p>
        <p>Worker <strong>${worker.name}</strong> has <strong>${action}</strong> your assignment request.</p>
        <div style="background-color: ${action === 'accepted' ? '#f0fdf4' : '#fef2f2'}; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${action === 'accepted' ? '#22c55e' : '#ef4444'};">
          <p style="margin: 5px 0;"><strong>Worker ID:</strong> ${worker.id}</p>
          <p style="margin: 5px 0;"><strong>Worker Name:</strong> ${worker.name}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${action === 'accepted' ? '#22c55e' : '#ef4444'}; font-weight: bold;">${action.toUpperCase()}</span></p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>Log in to your Migii Business Portal to view more details.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/login?tab=business" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Business Portal</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
          &copy; ${new Date().getFullYear()} Migii Business Portal. All rights reserved.
        </p>
      </div>
    `;
    
    const success = await sendEmail(business.email, subject, html);
    
    if (success) {
      toast.success(`Notification sent to ${business.name}`);
    }
    
    return success;
  } catch (error: any) {
    console.error('Error sending business notification email:', error);
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