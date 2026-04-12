-- Add new fields to users table for profile information

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS birthday DATE;

-- Create index for registration number lookups
CREATE INDEX IF NOT EXISTS idx_users_registration_number ON users(registration_number);
