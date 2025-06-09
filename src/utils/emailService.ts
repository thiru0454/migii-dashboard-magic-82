import { toast } from "sonner";
import nodemailer from 'nodemailer';

// Store OTPs temporarily (in a real app, this would be in a database)
const otpStore: Record<string, { otp: string, timestamp: number }> = {};

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a transporter for sending emails
const createTransporter = () => {
  // For production, you would use your actual SMTP credentials
  // For development/testing, we'll use a test account from Ethereal
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'yvette.kuvalis@ethereal.email', // generated ethereal user
      pass: 'Pu5Uf1Nt9Ym9Yd1Yjj'  // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates for development
    }
  });
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
    
    // Create transporter
    const transporter = createTransporter();
    
    // Send email
    const info = await transporter.sendMail({
      from: '"Migii Worker Portal" <noreply@migii.com>',
      to: email,
      subject,
      html
    });
    
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
    // Show success message with preview URL for testing
    toast.success(`OTP sent to ${email}`, {
      description: `Check your email or view at: ${nodemailer.getTestMessageUrl(info)}`
    });
    
    return true;
  } catch (error: any) {
    console.error('Error in email service:', error);
    toast.error(`Failed to send OTP: ${error.message}`);
    
    // For testing purposes, still store the OTP even if email fails
    const generatedOtp = "123456"; // Fallback test OTP
    otpStore[email] = {
      otp: generatedOtp,
      timestamp: Date.now() + 10 * 60 * 1000
    };
    
    toast.info(`For testing, use OTP: ${generatedOtp}`, {
      description: "Email service failed, but you can still use this test OTP"
    });
    
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

    // Create transporter
    const transporter = createTransporter();
    
    // Send email
    const info = await transporter.sendMail({
      from: '"Migii Worker Portal" <noreply@migii.com>',
      to: worker.email,
      subject,
      html
    });
    
    console.log('Registration email sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
    toast.success(`Registration confirmation sent to ${worker.email}`, {
      description: `Check your email or view at: ${nodemailer.getTestMessageUrl(info)}`
    });
    
    return true;
  } catch (error: any) {
    console.error('Error sending registration email:', error);
    toast.error(`Failed to send registration email: ${error.message}`);
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
    
    // Create transporter
    const transporter = createTransporter();
    
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
            <a href="${window.location.origin}/worker-login" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Apply</a>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
            &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
          </p>
        </div>
      `;
      
      return transporter.sendMail({
        from: '"Migii Worker Portal" <noreply@migii.com>',
        to: worker.email,
        subject,
        html
      });
    });
    
    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    // Log results
    results.forEach((info, index) => {
      console.log(`Job notification email sent to ${workers[index].email}: ${info.messageId}`);
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    });
    
    const successCount = results.length;
    
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

// Send job application confirmation to worker
export const sendJobApplicationConfirmation = async (
  worker: { name: string; email: string },
  job: { title: string; company: string; id: string }
): Promise<boolean> => {
  try {
    const subject = `Job Application Confirmation - ${job.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
        <h3 style="text-align: center;">Application Confirmation</h3>
        <p>Hello ${worker.name},</p>
        <p>Thank you for applying to the following position:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 5px 0; color: #4F46E5;">${job.title}</h4>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company}</p>
          <p style="margin: 5px 0;"><strong>Application ID:</strong> ${job.id}</p>
          <p style="margin: 5px 0;"><strong>Date Applied:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>Your application has been successfully submitted. The employer will review your application and contact you if you're selected for an interview.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/worker-login" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Application Status</a>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
          Good luck with your application!
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
          &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
        </p>
      </div>
    `;
    
    // Create transporter
    const transporter = createTransporter();
    
    // Send email
    const info = await transporter.sendMail({
      from: '"Migii Worker Portal" <noreply@migii.com>',
      to: worker.email,
      subject,
      html
    });
    
    console.log('Application confirmation email sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
    toast.success(`Application confirmation sent to ${worker.name}`, {
      description: `Check your email or view at: ${nodemailer.getTestMessageUrl(info)}`
    });
    
    return true;
  } catch (error: any) {
    console.error('Error sending job application confirmation:', error);
    toast.error(`Failed to send application confirmation: ${error.message}`);
    return false;
  }
};

// Send job application notification to business
export const sendJobApplicationNotificationToBusiness = async (
  business: { name: string; email: string },
  worker: { name: string; id: string },
  job: { title: string; id: string }
): Promise<boolean> => {
  try {
    const subject = `New Job Application - ${job.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #8B5CF6; text-align: center;">Migii Business Portal</h2>
        <h3 style="text-align: center;">New Job Application</h3>
        <p>Hello ${business.name},</p>
        <p>You have received a new application for your job posting:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 5px 0; color: #4F46E5;">${job.title}</h4>
          <p style="margin: 5px 0;"><strong>Job ID:</strong> ${job.id}</p>
        </div>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #22c55e;">
          <h4 style="margin: 5px 0; color: #22c55e;">Applicant Details</h4>
          <p style="margin: 5px 0;"><strong>Worker Name:</strong> ${worker.name}</p>
          <p style="margin: 5px 0;"><strong>Worker ID:</strong> ${worker.id}</p>
          <p style="margin: 5px 0;"><strong>Application Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>Log in to your Migii Business Portal to review the application and contact the worker.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${window.location.origin}/login?tab=business" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Application</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
          &copy; ${new Date().getFullYear()} Migii Business Portal. All rights reserved.
        </p>
      </div>
    `;
    
    // Create transporter
    const transporter = createTransporter();
    
    // Send email
    const info = await transporter.sendMail({
      from: '"Migii Business Portal" <noreply@migii.com>',
      to: business.email,
      subject,
      html
    });
    
    console.log('Application notification email sent to business: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error: any) {
    console.error('Error sending job application notification to business:', error);
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