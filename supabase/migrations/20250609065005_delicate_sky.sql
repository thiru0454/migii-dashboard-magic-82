-- Create email_logs table to track all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  type TEXT,
  worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_worker_id ON email_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_business_id ON email_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_job_id ON email_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Workers can view their own email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() = worker_id);

CREATE POLICY "Businesses can view their own email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() = business_id);

CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Add function to update email status
CREATE OR REPLACE FUNCTION update_email_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status = 'sent';
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for email status
CREATE TRIGGER update_email_status_trigger
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_status();