# Fix: Infinite Recursion Error in RLS

## The Problem

**Error Message:**
```
infinite recursion detected in policy for relation "users"
```

## Why This Happens

```
┌─────────────────────────────────────────────────────────┐
│  Admin tries to login                                   │
│  └─> Check users table for role                         │
│      └─> RLS policy checks: "Is user admin?"            │
│          └─> Query users table to check role            │
│              └─> RLS policy checks: "Is user admin?"    │
│                  └─> Query users table to check role    │
│                      └─> RLS policy checks...           │
│                          └─> INFINITE LOOP! 🔄          │
└─────────────────────────────────────────────────────────┘
```

**The Issue:**
- RLS policy on `users` table checks if user is admin
- To check if user is admin, it queries the `users` table
- But the `users` table has RLS enabled
- So it checks the policy again... forever!

## The Solution: SECURITY DEFINER Function

Create a special function that **bypasses RLS**:

```sql
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
```

**Key Point:** `SECURITY DEFINER` means:
- Function runs with **elevated privileges**
- **Bypasses RLS** when checking the users table
- Breaks the infinite loop!

## How to Fix

### Step 1: Drop Existing Policies

First, remove the old policies that cause recursion:

```sql
-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Admins have full access to users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile except role" ON users;

-- Drop policies on other tables
DROP POLICY IF EXISTS "Admins have full access to promises" ON promises;
DROP POLICY IF EXISTS "Admins have full access to payments" ON payments;
DROP POLICY IF EXISTS "Admins have full access to chanda_types" ON chanda_types;
DROP POLICY IF EXISTS "Admins have full access to quotes" ON quotes;
```

### Step 2: Apply Fixed SQL

Run the updated `rls-policies.sql` file which now:
1. Creates the `is_admin()` function FIRST
2. Uses `public.is_admin()` in all policies instead of querying users table directly

### Step 3: Verify

```sql
-- Check if function exists
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'is_admin';
-- Should show: is_admin | t (t = true = SECURITY DEFINER)

-- Test the function
SELECT public.is_admin();
-- Should return true if you're admin, false otherwise
```

## Complete Fix Script

Run this in Supabase SQL Editor:

```sql
-- 1. Drop all existing policies
DROP POLICY IF EXISTS "Admins have full access to users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile except role" ON users;
DROP POLICY IF EXISTS "Admins have full access to promises" ON promises;
DROP POLICY IF EXISTS "Users can read own promises" ON promises;
DROP POLICY IF EXISTS "Admins have full access to payments" ON payments;
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Admins have full access to chanda_types" ON chanda_types;
DROP POLICY IF EXISTS "Users can read chanda_types" ON chanda_types;
DROP POLICY IF EXISTS "Admins have full access to quotes" ON quotes;
DROP POLICY IF EXISTS "Users can read quotes" ON quotes;

-- 2. Now run the entire rls-policies.sql file
-- (Copy and paste the entire content from rls-policies.sql)
```

## Before vs After

### ❌ Before (Causes Recursion)

```sql
CREATE POLICY "Admins have full access to users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users  -- ⚠️ Queries users table
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

### ✅ After (No Recursion)

```sql
-- Helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users  -- ✅ Bypasses RLS
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy uses the function
CREATE POLICY "Admins have full access to users"
ON users
FOR ALL
TO authenticated
USING (public.is_admin());  -- ✅ No recursion!
```

## Why This Works

```
┌─────────────────────────────────────────────────────────┐
│  Admin tries to login                                   │
│  └─> Check users table for role                         │
│      └─> RLS policy calls: is_admin()                   │
│          └─> Function runs with SECURITY DEFINER        │
│              └─> Bypasses RLS on users table            │
│                  └─> Returns true/false                 │
│                      └─> Policy allows/denies access    │
│                          └─> SUCCESS! ✅                │
└─────────────────────────────────────────────────────────┘
```

## Testing

After applying the fix:

```sql
-- 1. Test as admin
SELECT public.is_admin();
-- Should return: true

-- 2. Try to read users
SELECT * FROM users;
-- Should work! ✅

-- 3. Test as regular user
-- Login as regular user, then:
SELECT public.is_admin();
-- Should return: false

SELECT * FROM users;
-- Should only see own profile ✅
```

## Important Notes

⚠️ **SECURITY DEFINER Functions:**
- Run with elevated privileges
- Bypass RLS
- Use carefully!
- Only use for admin checks
- Never expose sensitive data directly

✅ **Safe Usage:**
- Only return boolean (true/false)
- Don't return user data
- Keep logic simple
- Use for authorization checks only

## Summary

**Problem:** RLS policies checking users table caused infinite recursion

**Solution:** Create `is_admin()` function with `SECURITY DEFINER` that bypasses RLS

**Result:** No more recursion, admin can login! 🎉
