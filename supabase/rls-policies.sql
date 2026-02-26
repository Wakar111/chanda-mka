-- RLS Policies for MKA Charity App
-- This script enables Row Level Security and creates policies for all tables
-- Admin users have full access, regular users have limited access

-- ============================================
-- HELPER FUNCTION (Create this FIRST to avoid recursion)
-- ============================================

-- Create a helper function to check if user is admin
-- SECURITY DEFINER means it runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS TABLE
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything on users table
-- Uses the helper function to avoid recursion
CREATE POLICY "Admins have full access to users"
ON users
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile except role"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (
    SELECT role FROM public.users
    WHERE id = auth.uid()
  )
);

-- ============================================
-- PROMISES TABLE
-- ============================================

-- Enable RLS on promises table
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything on promises
CREATE POLICY "Admins have full access to promises"
ON promises
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Users can read their own promises
CREATE POLICY "Users can read own promises"
ON promises
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- PAYMENTS TABLE
-- ============================================

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything on payments
CREATE POLICY "Admins have full access to payments"
ON payments
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Users can read their own payments
CREATE POLICY "Users can read own payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM promises
    WHERE promises.id = payments.promise_id
    AND promises.user_id = auth.uid()
  )
);

-- ============================================
-- CHANDA_TYPES TABLE
-- ============================================

-- Enable RLS on chanda_types table
ALTER TABLE chanda_types ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything on chanda_types (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to chanda_types"
ON chanda_types
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: All authenticated users can read chanda_types (SELECT only)
CREATE POLICY "Users can read chanda_types"
ON chanda_types
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- QUOTES TABLE
-- ============================================

-- Enable RLS on quotes table
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything on quotes (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to quotes"
ON quotes
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: All authenticated users can read quotes (SELECT only)
CREATE POLICY "Users can read quotes"
ON quotes
FOR SELECT
TO authenticated
USING (true);


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View all policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
