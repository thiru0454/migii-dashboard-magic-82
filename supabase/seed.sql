-- Insert sample worker skills
INSERT INTO worker_skills (worker_id, skill_name) VALUES
('40c8a7e5-765d-4512-9399-a823af8fad2f', 'Plumbing'),
('40c8a7e5-765d-4512-9399-a823af8fad2f', 'Electrical'),
('40c8a7e5-765d-4512-9399-a823af8fad2f', 'Carpentry'),
('40c8a7e5-765d-4512-9399-a823af8fad2f', 'Painting');

-- Insert sample worker ratings
INSERT INTO worker_ratings (worker_id, rating) VALUES
('40c8a7e5-765d-4512-9399-a823af8fad2f', 4.5),
('40c8a7e5-765d-4512-9399-a823af8fad2f', 4.8),
('40c8a7e5-765d-4512-9399-a823af8fad2f', 4.2);

-- Insert sample job skills
INSERT INTO job_skills (job_id, skill_name) VALUES
('job1', 'Plumbing'),
('job1', 'Electrical'),
('job2', 'Carpentry'),
('job2', 'Painting'),
('job3', 'Plumbing'),
('job3', 'Carpentry');

-- Update jobs with priority and deadline
UPDATE jobs 
SET 
  priority = 'high',
  deadline = NOW() + INTERVAL '7 days'
WHERE id = 'job1';

UPDATE jobs 
SET 
  priority = 'medium',
  deadline = NOW() + INTERVAL '14 days'
WHERE id = 'job2';

UPDATE jobs 
SET 
  priority = 'low',
  deadline = NOW() + INTERVAL '30 days'
WHERE id = 'job3'; 