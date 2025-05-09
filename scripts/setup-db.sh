#!/bin/bash

# Run migrations
echo "Running migrations..."
psql -h localhost -U postgres -d migii -f supabase/migrations/20240320000000_worker_skills.sql

# Run seed data
echo "Seeding database..."
psql -h localhost -U postgres -d migii -f supabase/seed.sql

echo "Database setup complete!" 