-- Fix INSERT policy for users table
-- Split the admin policy into separate policies for different operations
-- This avoids potential recursion issues with is_admin() during INSERT

-- Step 1: Drop the combined "Admins have full access" policy
DROP POLICY IF EXISTS "Admins have full access to users" ON users;

-- Step 2: Create separate policies for each operation

-- Policy for SELECT (read)
CREATE POLICY "Admins can read all users"
ON users
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy for INSERT (create new users)
-- Check if the current user has admin role directly without function call
CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy for UPDATE (modify users)
CREATE POLICY "Admins can update users"
ON users
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy for DELETE (remove users)
CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Verification: Check all policies
-- SELECT * FROM pg_policies WHERE tablename = 'users';
