// Import nodemailer for email sending
import { createTransport } from "npm:nodemailer@6.9.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Store OTPs temporarily (in a real app, this would be in a database)
const otpStore: Record<string, { otp: string, timestamp: number }> = {};

// Generate a 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, recipients, data } = await req.json()

    // Configure email transporter
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: Deno.env.get('EMAIL_USER') || 'migii.worker.portal@gmail.com',
        pass: Deno.env.get('EMAIL_PASS') || 'your-app-password-here' // Use app password for Gmail
      }
    });

    let emailContent = ''
    let subject = ''
    let emailTo = to
    let otp = ''

    switch (type) {
      case 'registration':
        subject = 'Welcome to Migii - Registration Successful'
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
            <h3 style="text-align: center;">Registration Confirmation</h3>
            <p>Hello ${data.name},</p>
            <p>Thank you for registering with Migii Worker Portal. Your registration has been successfully processed.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Worker ID:</strong> ${data.id}</p>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
            </div>
            <p>You can now log in to the Migii Worker Portal using your phone number or email to receive jobs and access support.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
              &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
            </p>
          </div>
        `
        break

      case 'otp':
        // If OTP is provided, use it; otherwise generate a new one
        otp = data.otp || generateOTP();
        
        // Store OTP for verification (with 10-minute expiry)
        if (emailTo) {
          otpStore[emailTo] = {
            otp,
            timestamp: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
          };
        }
        
        subject = 'Your OTP Code for Migii Worker Portal'
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
            <p>Hello,</p>
            <p>Your one-time password (OTP) for login is:</p>
            <h1 style="text-align: center; letter-spacing: 5px; font-size: 32px; background-color: #f3f4f6; padding: 10px; border-radius: 5px;">${otp}</h1>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this OTP, please ignore this email.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
              &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
            </p>
          </div>
        `
        break

      case 'job-notification':
        subject = `New Job Opportunity: ${data.title}`
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
            <h3>New Job Opportunity</h3>
            <h2>${data.title}</h2>
            <p><strong>Company:</strong> ${data.company}</p>
            ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
            ${data.salary ? `<p><strong>Salary:</strong> ${data.salary}</p>` : ''}
            <p><strong>Description:</strong></p>
            <p>${data.description}</p>
            <p>Log in to your Migii account to apply for this position.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
              &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
            </p>
          </div>
        `
        break

      case 'job-application-confirmation':
        subject = 'Job Application Confirmation'
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
            <h3>Application Submitted Successfully</h3>
            <p>Dear ${data.workerName},</p>
            <p>Your application for the position of <strong>${data.jobTitle}</strong> at <strong>${data.company}</strong> has been submitted successfully.</p>
            <p>We will notify you once the employer reviews your application.</p>
            <p>Job ID: ${data.jobId}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
              &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
            </p>
          </div>
        `
        break

      case 'job-application-notification':
        subject = 'New Job Application Received'
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #8B5CF6; text-align: center;">Migii Worker Portal</h2>
            <h3>New Job Application</h3>
            <p>Dear ${data.businessName},</p>
            <p>You have received a new application for the position: <strong>${data.jobTitle}</strong></p>
            <p><strong>Applicant:</strong> ${data.workerName}</p>
            <p><strong>Skills:</strong> ${data.workerSkill}</p>
            <p><strong>Worker ID:</strong> ${data.workerId}</p>
            <p>Log in to your Migii business dashboard to review the application.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
              &copy; ${new Date().getFullYear()} Migii Worker Portal. All rights reserved.
            </p>
          </div>
        `
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    // Send email
    let info;
    if (recipients && Array.isArray(recipients) && recipients.length > 0) {
      // Send to multiple recipients
      for (const recipient of recipients) {
        info = await transporter.sendMail({
          from: '"Migii Worker Portal" <migii.worker.portal@gmail.com>',
          to: recipient.email,
          subject,
          html: emailContent
        });
        console.log(`Email sent to ${recipient.email}: ${info.messageId}`);
      }
    } else if (emailTo) {
      // Send to a single recipient
      info = await transporter.sendMail({
        from: '"Migii Worker Portal" <migii.worker.portal@gmail.com>',
        to: emailTo,
        subject,
        html: emailContent
      });
      console.log(`Email sent to ${emailTo}: ${info.messageId}`);
    } else {
      throw new Error('No recipients specified');
    }

    // For OTP emails, return the OTP for testing purposes
    const response = {
      success: true,
      message: 'Email sent successfully',
    };
    
    if (type === 'otp') {
      response.otp = otp;
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})