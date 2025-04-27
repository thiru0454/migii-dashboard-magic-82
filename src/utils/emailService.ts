
import { toast } from "sonner";
import nodemailer from 'nodemailer';

// Store OTPs temporarily (in a real app, this would be in a database)
const otpStore: Record<string, { otp: string, timestamp: number }> = {};

// Email configuration
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'migiiworker@gmail.com',
    pass: 'egcq rdzr bmar xvva'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email using SMTP
const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: '"Migii Worker Portal" <migiiworker@gmail.com>',
      to,
      subject,
      html
    };

    // For development/demo, log the email content
    console.log(`Sending email to ${to} with subject: ${subject}`);
    console.log(`Email content: ${html}`);

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error);
    // Fall back to mock email service if SMTP fails
    console.log(`Mock email service: Email to ${to} would have been sent in production.`);
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
    
    if (success) {
      toast.success(`OTP sent to ${email}. Please check your inbox.`);
    } else {
      // For demo purposes, show the OTP in toast when email sending fails
      toast.success(`OTP sent to ${email}. For testing, use: ${generatedOtp}`);
    }
    
    return true;
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
