# RLS Visual Guide - How Policies Work

## The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR APPLICATION                          │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  Admin User  │              │ Regular User │            │
│  │  (role=admin)│              │ (role=user)  │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                             │                     │
│         │  Tries to access quotes     │                     │
│         ▼                             ▼                     │
└─────────┼─────────────────────────────┼─────────────────────┘
          │                             │
          │                             │
┌─────────▼─────────────────────────────▼─────────────────────┐
│              SUPABASE DATABASE (PostgreSQL)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              QUOTES TABLE (RLS ENABLED)                │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────┐    │ │
│  │  │  RLS POLICIES (Security Guards)              │    │ │
│  │  │                                              │    │ │
│  │  │  Policy 1: "Admins have full access"        │    │ │
│  │  │  ├─ Check: Is user admin?                   │    │ │
│  │  │  ├─ If YES → Allow ALL operations           │    │ │
│  │  │  └─ If NO → Check next policy               │    │ │
│  │  │                                              │    │ │
│  │  │  Policy 2: "Users can read quotes"          │    │ │
│  │  │  ├─ Check: Is user authenticated?           │    │ │
│  │  │  ├─ If YES → Allow SELECT only              │    │ │
│  │  │  └─ If NO → Deny access                     │    │ │
│  │  └──────────────────────────────────────────────┘    │ │
│  │                                                        │ │
│  │  Data: [Quote 1] [Quote 2] [Quote 3] ...             │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Request Flow: Admin User

```
1. Admin clicks "Delete Quote"
   │
   ▼
2. Frontend sends DELETE request
   │
   ▼
3. Supabase receives request
   │
   ▼
4. RLS checks policies:
   │
   ├─ Policy 1: "Admins have full access"
   │  │
   │  ├─ Check: auth.uid() = user's ID ✓
   │  ├─ Check: user.role = 'admin' ✓
   │  │
   │  └─ RESULT: ALLOW ✅
   │
   ▼
5. Quote deleted successfully!
```

---

## Request Flow: Regular User

```
1. User clicks "Delete Quote"
   │
   ▼
2. Frontend sends DELETE request
   │
   ▼
3. Supabase receives request
   │
   ▼
4. RLS checks policies:
   │
   ├─ Policy 1: "Admins have full access"
   │  │
   │  ├─ Check: auth.uid() = user's ID ✓
   │  ├─ Check: user.role = 'admin' ✗ (role = 'user')
   │  │
   │  └─ RESULT: SKIP (check next policy)
   │
   ├─ Policy 2: "Users can read quotes"
   │  │
   │  ├─ Operation: DELETE
   │  ├─ Policy allows: SELECT only
   │  │
   │  └─ RESULT: SKIP (doesn't match)
   │
   ├─ No more policies
   │
   ▼
5. ERROR: Permission denied ❌
```

---

## Policy Decision Tree

```
                    User makes request
                           │
                           ▼
                   Is RLS enabled?
                    ┌──────┴──────┐
                   NO             YES
                    │              │
                    ▼              ▼
            Allow everything   Check policies
                               ┌────┴────┐
                               │         │
                          Policy 1   Policy 2
                               │         │
                    ┌──────────┴─────────┴──────────┐
                    │                                │
              Does policy match?                     │
            ┌───────┴───────┐                        │
           YES              NO                       │
            │                │                       │
            ▼                ▼                       │
      Check USING      Try next policy              │
       condition            │                        │
      ┌────┴────┐           └────────────────────────┘
     YES        NO                                    │
      │          │                                    │
      ▼          ▼                                    ▼
   ALLOW      DENY                          No policies match
                                                      │
                                                      ▼
                                                    DENY
```

---

## Example: Quotes Table Policies

### Scenario 1: Admin Reads Quotes

```
┌─────────────────────────────────────────────────┐
│ Request: SELECT * FROM quotes;                  │
│ User: admin@example.com (role = 'admin')        │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Policy 1: "Admins have full access"             │
│                                                 │
│ FOR ALL ← Includes SELECT ✓                     │
│ TO authenticated ← User is logged in ✓          │
│ USING (user.role = 'admin') ← TRUE ✓            │
│                                                 │
│ RESULT: ✅ ALLOW                                │
└─────────────────────────────────────────────────┘
                     │
                     ▼
         Returns all quotes from database
```

### Scenario 2: Regular User Reads Quotes

```
┌─────────────────────────────────────────────────┐
│ Request: SELECT * FROM quotes;                  │
│ User: user@example.com (role = 'user')          │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Policy 1: "Admins have full access"             │
│                                                 │
│ FOR ALL ← Includes SELECT ✓                     │
│ TO authenticated ← User is logged in ✓          │
│ USING (user.role = 'admin') ← FALSE ✗           │
│                                                 │
│ RESULT: ⏭️ SKIP (try next policy)               │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Policy 2: "Users can read quotes"               │
│                                                 │
│ FOR SELECT ← Matches SELECT ✓                   │
│ TO authenticated ← User is logged in ✓          │
│ USING (true) ← Always TRUE ✓                    │
│                                                 │
│ RESULT: ✅ ALLOW                                │
└─────────────────────────────────────────────────┘
                     │
                     ▼
         Returns all quotes from database
```

### Scenario 3: Regular User Tries to Delete Quote

```
┌─────────────────────────────────────────────────┐
│ Request: DELETE FROM quotes WHERE id = 1;       │
│ User: user@example.com (role = 'user')          │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Policy 1: "Admins have full access"             │
│                                                 │
│ FOR ALL ← Includes DELETE ✓                     │
│ TO authenticated ← User is logged in ✓          │
│ USING (user.role = 'admin') ← FALSE ✗           │
│                                                 │
│ RESULT: ⏭️ SKIP (try next policy)               │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Policy 2: "Users can read quotes"               │
│                                                 │
│ FOR SELECT ← Does NOT include DELETE ✗          │
│                                                 │
│ RESULT: ⏭️ SKIP (doesn't match operation)       │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ No more policies to check                       │
│                                                 │
│ RESULT: ❌ DENY                                 │
│ Error: "permission denied for table quotes"     │
└─────────────────────────────────────────────────┘
```

---

## Policy Components Breakdown

### FOR Clause (What Operations)

```
FOR ALL
├─ SELECT   (Read)
├─ INSERT   (Create)
├─ UPDATE   (Modify)
└─ DELETE   (Remove)

FOR SELECT
└─ SELECT only (Read-only)

FOR INSERT
└─ INSERT only (Create-only)

FOR UPDATE
└─ UPDATE only (Modify-only)

FOR DELETE
└─ DELETE only (Remove-only)
```

### TO Clause (Who Can Use)

```
TO authenticated
└─ Only logged-in users

TO anon
└─ Only anonymous (not logged in)

TO public
├─ authenticated (logged in)
└─ anon (not logged in)
```

### USING Clause (Which Rows)

```
USING (true)
└─ All rows (no restriction)

USING (auth.uid() = user_id)
└─ Only rows where user_id matches current user

USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
└─ Only if current user is admin
```

---

## Real-World Analogy

Think of RLS like a **nightclub with bouncers**:

```
┌─────────────────────────────────────────────┐
│           NIGHTCLUB (Database Table)        │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  BOUNCER 1 (Policy 1)                 │ │
│  │  "VIP members can do anything"        │ │
│  │                                       │ │
│  │  Check ID → Are you VIP?              │ │
│  │  ├─ YES → Enter, drink, dance, leave  │ │
│  │  └─ NO → Check with next bouncer      │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  BOUNCER 2 (Policy 2)                 │ │
│  │  "Regular members can only enter"     │ │
│  │                                       │ │
│  │  Check ID → Are you a member?         │ │
│  │  ├─ YES → Enter (but can't drink)     │ │
│  │  └─ NO → Denied entry                 │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Inside: [Tables] [Bar] [Dance Floor]      │
└─────────────────────────────────────────────┘
```

- **VIP (Admin)** = Can do everything
- **Regular Member (User)** = Can only look around (SELECT)
- **No Membership** = Can't enter at all

---

## Summary

**RLS works like this:**

1. **User makes request** (SELECT, INSERT, UPDATE, DELETE)
2. **Database checks policies** one by one
3. **First matching policy wins**
4. **If no policy matches** → DENY
5. **If policy matches** → Check USING condition
6. **If USING is TRUE** → ALLOW
7. **If USING is FALSE** → Try next policy

**Key Points:**
- ✅ Policies are checked in order
- ✅ First match wins
- ✅ No match = denied
- ✅ Admin policies should come first
- ✅ User policies should come after

That's it! RLS is just a series of "if-then" checks to protect your data. 🔒
