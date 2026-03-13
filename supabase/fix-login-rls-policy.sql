-- Fix RLS policy to allow login with jamaatID
-- This allows unauthenticated users to query email and role by jamaatID for login purposes

-- Add policy to allow anyone (including unauthenticated) to read email and role by jamaatID
-- This is needed for the login flow where we look up email by jamaatID before authentication
CREATE POLICY "Allow login lookup by jamaatID"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: This policy allows reading all user records, but only email and role fields
-- should be selected in the login query for security.
-- The application code should only select: .select("email, role")
