-- Add musi column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS musi BOOLEAN DEFAULT false;

-- Add comment to the column
COMMENT ON COLUMN users.musi IS 'Indicates if the user is a musi member';
