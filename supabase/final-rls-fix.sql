-- Final RLS fix for users table INSERT issue
-- The problem: The INSERT policy's WITH CHECK clause queries the users table,
-- which itself has RLS enabled, causing a circular dependency

-- Solution: Use a simpler approach - check role from auth.jwt() metadata
-- OR temporarily disable RLS for the admin check query

-- Step 1: Drop all existing admin policies
DROP POLICY IF EXISTS "Admins have full access to users" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Step 2: Recreate is_admin function with SECURITY DEFINER to bypass RLS
-- Don't drop - just replace it since other tables depend on it
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Use SECURITY DEFINER to bypass RLS when checking role
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create simple admin policy using the function
CREATE POLICY "Admins have full access to users"
ON users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Keep other policies
-- (Login policy should already exist)
-- (User read own profile should already exist)
-- (User update own profile should already exist)

-- Verification
SELECT * FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;
