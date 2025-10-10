# Supabase Edge Functions

## Setup

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref vdlmznerefysumgprqyz
```

## Deploy the delete-user function

```bash
supabase functions deploy delete-user
```

## Test locally

```bash
supabase functions serve delete-user
```

## What the function does

The `delete-user` function:
- Verifies the caller is an admin
- Deletes a user from Supabase Auth using the service role key
- This is secure because the service role key is never exposed to the frontend

## Environment Variables

The function automatically has access to:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

No additional configuration needed!
