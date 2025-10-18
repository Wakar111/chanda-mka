# Row Level Security (RLS) Setup Guide

## Overview

This guide explains how to enable Row Level Security (RLS) for your Supabase database to ensure:
- **Admins** have full access to all tables
- **Users** can only read/update their own data
- **Users cannot change their role** (security critical)

## What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that allows you to control which rows users can access in database tables. Without RLS, anyone with your `SUPABASE_ANON_KEY` can read/modify all data.

## How to Apply RLS Policies

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy the entire contents of `rls-policies.sql`
6. Paste into the SQL editor
7. Click **"Run"** or press `Ctrl/Cmd + Enter`

### Method 2: Using Supabase CLI

```bash
# Make sure you're in the project directory
cd /Users/wakar/Documents/Projekte/chanda-mka/charity

# Run the SQL file
supabase db push
```

## RLS Policies Explained

### Users Table

| Policy | Who | What | Condition |
|--------|-----|------|-----------|
| Admins have full access | Admin | All operations | User role = 'admin' |
| Users can read own profile | User | SELECT | User ID matches auth.uid() |
| Users can update own profile | User | UPDATE | User ID matches AND role unchanged |

**Important:** Users **cannot** change their own role. This prevents privilege escalation.

### Promises Table

| Policy | Who | What | Condition |
|--------|-----|------|-----------|
| Admins have full access | Admin | All operations | User role = 'admin' |
| Users can read own promises | User | SELECT | promise.user_id matches auth.uid() |

### Payments Table

| Policy | Who | What | Condition |
|--------|-----|------|-----------|
| Admins have full access | Admin | All operations | User role = 'admin' |
| Users can read own payments | User | SELECT | Payment belongs to user's promise |

## Testing RLS

### Test as Admin

```sql
-- Login as admin user in your app
-- Try to read all users (should work)
SELECT * FROM users;

-- Try to update any user (should work)
UPDATE users SET name = 'Test' WHERE id = 'some-user-id';
```

### Test as Regular User

```sql
-- Login as regular user in your app
-- Try to read all users (should only see own profile)
SELECT * FROM users;

-- Try to update own profile (should work)
UPDATE users SET name = 'New Name' WHERE id = auth.uid();

-- Try to change own role (should FAIL)
UPDATE users SET role = 'admin' WHERE id = auth.uid();

-- Try to update another user (should FAIL)
UPDATE users SET name = 'Hacked' WHERE id = 'other-user-id';
```

## Verification

After applying RLS, verify it's enabled:

```sql
-- Check if RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';
```

Expected output:
- `rowsecurity` should be `true` for all tables
- You should see multiple policies for each table

## Important Notes

### 1. Service Role Key
The `SUPABASE_SERVICE_ROLE_KEY` **bypasses RLS**. This is why we use it in the Edge Function for admin operations. Never expose this key in your frontend!

### 2. Anon Key
The `SUPABASE_ANON_KEY` **respects RLS**. This is safe to use in your frontend because RLS policies protect your data.

### 3. User Profile Updates
Users can update their profile fields EXCEPT:
- `role` - Cannot change their own role
- `id` - Cannot change their ID

This is enforced by the policy:
```sql
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM users WHERE id = auth.uid())
)
```

### 4. Admin Operations
Admins can:
- Create users
- Update any user (including roles)
- Delete users
- View all data
- Modify all data

### 5. Edge Functions
The `delete-user` Edge Function uses the service role key to bypass RLS for admin operations. This is secure because:
- The function verifies the caller is an admin
- The service role key is never exposed to the frontend
- It runs on Supabase's secure servers

## Troubleshooting

### Issue: "permission denied for table users"
**Solution:** RLS is enabled but no policies match. Make sure you're logged in and policies are applied.

### Issue: Users can't update their profile
**Solution:** Check that the user is authenticated and the policy allows updates. Run:
```sql
SELECT auth.uid(); -- Should return user's ID
```

### Issue: Admins can't access data
**Solution:** Verify the admin user has `role = 'admin'` in the users table:
```sql
SELECT id, email, role FROM users WHERE role = 'admin';
```

## Security Best Practices

✅ **DO:**
- Keep RLS enabled on all tables
- Use the anon key in frontend
- Use service role key only in backend/Edge Functions
- Test policies thoroughly

❌ **DON'T:**
- Disable RLS in production
- Expose service role key in frontend
- Allow users to change their own roles
- Trust client-side validation alone

## Next Steps

After applying RLS:
1. Test login as admin - verify full access
2. Test login as user - verify limited access
3. Try to change user role - should fail
4. Test profile updates - should work
5. Monitor Supabase logs for policy violations

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify policies with the verification queries above
3. Test with SQL Editor using different user contexts
