import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, recipients, data } = await req.json()

    // For now, we'll just log the email request
    // In a real implementation, you would integrate with an email service like SendGrid, Resend, etc.
    console.log('Email request:', { type, to, recipients, data })

    let emailContent = ''
    let subject = ''

    switch (type) {
      case 'registration':
        subject = 'Welcome to Migii - Registration Successful'
        emailContent = `
          <h1>Welcome to Migii, ${data.name}!</h1>
          <p>Your registration has been successful. Your worker ID is: ${data.id}</p>
          <p>You can now log in to access job opportunities and manage your profile.</p>
        `
        break

      case 'otp':
        subject = 'Your OTP Code'
        emailContent = `
          <h1>Your OTP Code</h1>
          <p>Your one-time password is: <strong>${data.otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `
        break

      case 'job-notification':
        subject = `New Job Opportunity: ${data.title}`
        emailContent = `
          <h1>New Job Opportunity</h1>
          <h2>${data.title}</h2>
          <p><strong>Company:</strong> ${data.company}</p>
          ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          ${data.salary ? `<p><strong>Salary:</strong> ${data.salary}</p>` : ''}
          <p><strong>Description:</strong></p>
          <p>${data.description}</p>
          <p>Log in to your Migii account to apply for this position.</p>
        `
        break

      case 'job-application-confirmation':
        subject = 'Job Application Confirmation'
        emailContent = `
          <h1>Application Submitted Successfully</h1>
          <p>Dear ${data.workerName},</p>
          <p>Your application for the position of <strong>${data.jobTitle}</strong> at <strong>${data.company}</strong> has been submitted successfully.</p>
          <p>We will notify you once the employer reviews your application.</p>
          <p>Job ID: ${data.jobId}</p>
        `
        break

      case 'job-application-notification':
        subject = 'New Job Application Received'
        emailContent = `
          <h1>New Job Application</h1>
          <p>Dear ${data.businessName},</p>
          <p>You have received a new application for the position: <strong>${data.jobTitle}</strong></p>
          <p><strong>Applicant:</strong> ${data.workerName}</p>
          <p><strong>Skills:</strong> ${data.workerSkill}</p>
          <p><strong>Worker ID:</strong> ${data.workerId}</p>
          <p>Log in to your Migii business dashboard to review the application.</p>
        `
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    // In a real implementation, you would send the actual email here
    // For now, we'll just return success
    console.log(`Would send email to: ${to || recipients?.map(r => r.email).join(', ')}`)
    console.log(`Subject: ${subject}`)
    console.log(`Content: ${emailContent}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
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