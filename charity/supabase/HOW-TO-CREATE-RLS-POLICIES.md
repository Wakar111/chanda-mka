# How to Create RLS Policies - Step by Step Tutorial

## Understanding RLS Basics

**RLS (Row Level Security)** is like a security guard for your database tables. It controls:
- **WHO** can access data (admins vs users)
- **WHAT** they can do (read, create, update, delete)
- **WHICH ROWS** they can access (their own data vs all data)

---

## Step-by-Step Guide

### Step 1: Enable RLS on a Table

**Syntax:**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

**Example:**
```sql
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
```

**What this does:**
- Turns on RLS for the table
- By default, **blocks ALL access** to everyone
- You must create policies to allow access

---

### Step 2: Create Policies

A policy has **4 main parts**:

#### Part 1: Policy Name
```sql
CREATE POLICY "policy_name_here"
```
- Use descriptive names like "Admins can delete quotes"
- Helps you understand what the policy does

#### Part 2: Target Table
```sql
ON table_name
```
- Which table this policy applies to

#### Part 3: Operation Type
```sql
FOR operation_type
```

**Options:**
- `FOR ALL` - All operations (SELECT, INSERT, UPDATE, DELETE)
- `FOR SELECT` - Only reading data
- `FOR INSERT` - Only creating new rows
- `FOR UPDATE` - Only modifying existing rows
- `FOR DELETE` - Only deleting rows

#### Part 4: Who Can Use This Policy
```sql
TO role_name
```

**Common roles:**
- `authenticated` - Any logged-in user
- `anon` - Anonymous (not logged in)
- `public` - Everyone (logged in or not)

#### Part 5: Conditions

**USING clause** - Who can see/access rows
```sql
USING (condition)
```

**WITH CHECK clause** - What can be inserted/updated
```sql
WITH CHECK (condition)
```

---

## Complete Example: Quotes Table

Let's create RLS for the `quotes` table step by step:

### Step 1: Enable RLS
```sql
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
```

### Step 2: Admin Policy (Full Access)

```sql
CREATE POLICY "Admins have full access to quotes"
ON quotes                    -- Target table
FOR ALL                      -- All operations (SELECT, INSERT, UPDATE, DELETE)
TO authenticated             -- Only logged-in users
USING (                      -- Condition: Check if user is admin
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()    -- auth.uid() = current logged-in user ID
    AND users.role = 'admin'       -- Must have admin role
  )
);
```

**Breakdown:**
1. **Policy Name**: "Admins have full access to quotes"
2. **Table**: `quotes`
3. **Operations**: `FOR ALL` = SELECT, INSERT, UPDATE, DELETE
4. **Who**: `TO authenticated` = logged-in users only
5. **Condition**: 
   - `auth.uid()` = ID of currently logged-in user
   - Check if this user has `role = 'admin'` in users table
   - If yes → allow access
   - If no → deny access

### Step 3: User Policy (Read-Only)

```sql
CREATE POLICY "Users can read quotes"
ON quotes                    -- Target table
FOR SELECT                   -- Only reading (no INSERT, UPDATE, DELETE)
TO authenticated             -- Only logged-in users
USING (true);                -- Always true = everyone can read
```

**Breakdown:**
1. **Policy Name**: "Users can read quotes"
2. **Table**: `quotes`
3. **Operations**: `FOR SELECT` = only reading
4. **Who**: `TO authenticated` = logged-in users
5. **Condition**: `USING (true)` = always allow (no restrictions)

---

## Common Patterns

### Pattern 1: Admin-Only Table (Full Control)

**Use case:** Only admins can create, read, update, delete

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins have full access to table_name"
ON table_name
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Users can read only
CREATE POLICY "Users can read table_name"
ON table_name
FOR SELECT
TO authenticated
USING (true);
```

### Pattern 2: User Owns Their Data

**Use case:** Users can only see/edit their own rows

```sql
-- Enable RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins have full access to user_data"
ON user_data
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Users can read their own data
CREATE POLICY "Users can read own data"
ON user_data
FOR SELECT
TO authenticated
USING (user_id = auth.uid());  -- Only rows where user_id matches logged-in user

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON user_data
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### Pattern 3: Public Read, Admin Write

**Use case:** Everyone can read, only admins can modify

```sql
-- Enable RLS
ALTER TABLE public_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read (even not logged in)
CREATE POLICY "Public can read content"
ON public_content
FOR SELECT
TO public
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify content"
ON public_content
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

## How to Apply Your RLS Policies

### Method 1: Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste your SQL code
6. Click **Run** (or press Ctrl/Cmd + Enter)

### Method 2: Supabase CLI

```bash
# Create a new migration file
supabase migration new add_rls_policies

# Edit the file and add your SQL
# Then apply it
supabase db push
```

---

## Testing Your Policies

### Test 1: Check if RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Expected: `rowsecurity = true` for all tables

### Test 2: View All Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,  -- Operation type (SELECT, INSERT, UPDATE, DELETE, ALL)
  roles -- Who can use this policy
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Test 3: Test as User

Login as a regular user and try:

```sql
-- Should work (read-only)
SELECT * FROM quotes;

-- Should fail (users can't insert)
INSERT INTO quotes (text, author) VALUES ('Test', 'Me');
```

### Test 4: Test as Admin

Login as admin and try:

```sql
-- Should work (admins can do everything)
SELECT * FROM quotes;
INSERT INTO quotes (text, author) VALUES ('Test', 'Admin');
UPDATE quotes SET text = 'Updated' WHERE id = 1;
DELETE FROM quotes WHERE id = 1;
```

---

## Troubleshooting

### Error: "new row violates row-level security policy"

**Cause:** Your policy's `WITH CHECK` condition failed

**Solution:** Check your `WITH CHECK` clause or use `USING` clause for both

### Error: "permission denied for table"

**Cause:** No policy matches your operation

**Solution:** 
1. Verify you're logged in: `SELECT auth.uid();`
2. Check your role: `SELECT role FROM users WHERE id = auth.uid();`
3. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`

### Users Can't See Any Data

**Cause:** RLS is enabled but no policies allow access

**Solution:** Create a policy with `USING (true)` for read access

---

## Quick Reference

### Enable RLS
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Disable RLS (not recommended in production)
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Drop a Policy
```sql
DROP POLICY "policy_name" ON table_name;
```

### Check Current User
```sql
SELECT auth.uid();  -- Returns current user's ID
```

### Check User Role
```sql
SELECT role FROM users WHERE id = auth.uid();
```

---

## Best Practices

✅ **DO:**
- Always enable RLS on all tables
- Create separate policies for different operations (SELECT, INSERT, UPDATE, DELETE)
- Test policies with different user roles
- Use descriptive policy names
- Document your policies

❌ **DON'T:**
- Disable RLS in production
- Use `USING (true)` for write operations (INSERT, UPDATE, DELETE) unless you really mean it
- Forget to test as both admin and regular user
- Allow users to change their own roles

---

## Summary: Creating RLS for Any Table

**Template:**

```sql
-- 1. Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 2. Admin full access
CREATE POLICY "Admins have full access to your_table"
ON your_table
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 3. User read access (adjust as needed)
CREATE POLICY "Users can read your_table"
ON your_table
FOR SELECT
TO authenticated
USING (true);  -- Or add conditions like: user_id = auth.uid()
```

**That's it!** Just replace `your_table` with your actual table name and adjust the user policy based on your needs.

---

## Next Steps

1. Apply the updated `rls-policies.sql` to your database
2. Test with different user accounts
3. Monitor Supabase logs for policy violations
4. Create policies for any new tables you add in the future

Good luck! 🚀
