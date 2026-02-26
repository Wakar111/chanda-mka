-- Change phone column from int8 to text type in users table
-- This allows storing phone numbers with leading zeros (e.g., 0175...) and international format (e.g., +49175...)

-- First, convert existing phone numbers to text format
-- Existing numbers will be preserved, but leading zeros that were lost will need manual correction
ALTER TABLE users
ALTER COLUMN phone TYPE text USING phone::text;

-- Add comment to the column
COMMENT ON COLUMN users.phone IS 'Phone number in text format to preserve leading zeros and international format (+49 or 0)';
