-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    salary TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    workers_needed INTEGER NOT NULL,
    duration TEXT NOT NULL,
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(job_id, worker_id)
);

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create worker_notifications table
CREATE TABLE IF NOT EXISTS worker_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    worker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_required BOOLEAN DEFAULT false,
    action_type TEXT
);

-- Create business_notifications table
CREATE TABLE IF NOT EXISTS business_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE
);

-- Create RLS policies for jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs are viewable by everyone"
    ON jobs FOR SELECT
    USING (true);

CREATE POLICY "Businesses can create jobs"
    ON jobs FOR INSERT
    WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Businesses can update their own jobs"
    ON jobs FOR UPDATE
    USING (auth.uid() = business_id);

CREATE POLICY "Businesses can delete their own jobs"
    ON jobs FOR DELETE
    USING (auth.uid() = business_id);

-- Create RLS policies for job_applications table
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job applications are viewable by related parties"
    ON job_applications FOR SELECT
    USING (
        auth.uid() = worker_id OR
        auth.uid() IN (
            SELECT business_id FROM jobs WHERE id = job_applications.job_id
        )
    );

CREATE POLICY "Workers can create job applications"
    ON job_applications FOR INSERT
    WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Businesses can update job applications for their jobs"
    ON job_applications FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT business_id FROM jobs WHERE id = job_applications.job_id
        )
    );

-- Create RLS policies for admin_notifications table
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin notifications are viewable by admins"
    ON admin_notifications FOR SELECT
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Businesses can create admin notifications"
    ON admin_notifications FOR INSERT
    WITH CHECK (auth.uid() = business_id);

-- Create RLS policies for worker_notifications table
ALTER TABLE worker_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view their own notifications"
    ON worker_notifications FOR SELECT
    USING (auth.uid() = worker_id);

CREATE POLICY "System can create worker notifications"
    ON worker_notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Workers can update their own notifications"
    ON worker_notifications FOR UPDATE
    USING (auth.uid() = worker_id);

-- Create RLS policies for business_notifications table
ALTER TABLE business_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can view their own notifications"
    ON business_notifications FOR SELECT
    USING (auth.uid() = business_id);

CREATE POLICY "System can create business notifications"
    ON business_notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Businesses can update their own notifications"
    ON business_notifications FOR UPDATE
    USING (auth.uid() = business_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 