-- Complete RLS fix for users table
-- This script fixes both login and user creation issues

-- Step 1: Drop existing admin policy
DROP POLICY IF EXISTS "Admins have full access to users" ON users;

-- Step 2: Recreate admin policy with WITH CHECK for INSERT operations
CREATE POLICY "Admins have full access to users"
ON users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Step 3: Keep the login policy (if it doesn't exist yet, create it)
-- This allows unauthenticated users to query email/role by jamaatID for login
DROP POLICY IF EXISTS "Allow login lookup by jamaatID" ON users;

CREATE POLICY "Allow login lookup by jamaatID"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- Verification: Check all policies on users table
-- Run this to verify:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
