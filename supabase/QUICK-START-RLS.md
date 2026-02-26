# Quick Start: Enable RLS

## Step 1: Apply RLS Policies (5 minutes)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Copy all content from `rls-policies.sql`
4. Paste and click **Run**
5. ✅ Done!

## Step 2: Verify (2 minutes)

Run this query in SQL Editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`

## What Changed?

### Before RLS ❌
- Anyone with anon key could read/modify ALL data
- Users could change their own roles to admin
- No data protection

### After RLS ✅
- **Admins**: Full access to everything
- **Users**: Can only see/edit their own data
- **Users CANNOT change their role**
- Data is protected by PostgreSQL

## Security Summary

| Action | Admin | User |
|--------|-------|------|
| Read all users | ✅ | ❌ (only own) |
| Update any user | ✅ | ❌ (only own) |
| Delete users | ✅ | ❌ |
| Change own role | ✅ | ❌ |
| Update own profile | ✅ | ✅ |
| Read own promises | ✅ | ✅ |
| Read all promises | ✅ | ❌ |

## Testing

### Test as User:
1. Login as regular user
2. Go to Profile page
3. Try to edit profile → Should work ✅
4. Open browser console
5. Try: `supabase.from('users').select('*')` → Should only see own profile ✅

### Test as Admin:
1. Login as admin
2. Go to Admin Dashboard
3. Should see all users ✅
4. Try to edit any user → Should work ✅

## Important Files Modified

- ✅ `Profile.tsx` - Now prevents role/id changes
- ✅ `rls-policies.sql` - Contains all RLS policies
- ✅ Database - RLS enabled on all tables

## Need Help?

See `RLS-SETUP.md` for detailed documentation.
