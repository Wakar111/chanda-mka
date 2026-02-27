-- ============================================
-- SETTINGS TABLES FOR MKA CHARITY APP
-- ============================================
-- This script creates the jamaat_settings and chanda_collectors tables
-- with RLS policies for admin (full access) and user (read-only)

-- ============================================
-- JAMAAT_SETTINGS TABLE
-- ============================================

-- Create jamaat_settings table
-- This table stores the Jamaat configuration settings
-- Only one row should exist in this table (singleton pattern)
CREATE TABLE IF NOT EXISTS public.jamaat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jamaat_name TEXT,
  street TEXT,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  total_members INTEGER,
  ansar_count INTEGER,
  khuddam_count INTEGER,
  tifl_count INTEGER,
  lajna_count INTEGER,
  nazarat_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger for jamaat_settings
CREATE OR REPLACE FUNCTION update_jamaat_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jamaat_settings_updated_at
BEFORE UPDATE ON public.jamaat_settings
FOR EACH ROW
EXECUTE FUNCTION update_jamaat_settings_updated_at();

-- ============================================
-- CHANDA_COLLECTORS TABLE
-- ============================================

-- Create chanda_collectors table
-- This table stores members authorized to collect Chanda donations
CREATE TABLE IF NOT EXISTS public.chanda_collectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shoba_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  nizam TEXT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger for chanda_collectors
CREATE OR REPLACE FUNCTION update_chanda_collectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chanda_collectors_updated_at
BEFORE UPDATE ON public.chanda_collectors
FOR EACH ROW
EXECUTE FUNCTION update_chanda_collectors_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on jamaat_settings table
ALTER TABLE public.jamaat_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on chanda_collectors table
ALTER TABLE public.chanda_collectors ENABLE ROW LEVEL SECURITY;

-- ============================================
-- JAMAAT_SETTINGS RLS POLICIES
-- ============================================

-- Policy: Admins have full access to jamaat_settings (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to jamaat_settings"
ON public.jamaat_settings
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Regular users can only read jamaat_settings (SELECT only)
CREATE POLICY "Users can read jamaat_settings"
ON public.jamaat_settings
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- CHANDA_COLLECTORS RLS POLICIES
-- ============================================

-- Policy: Admins have full access to chanda_collectors (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to chanda_collectors"
ON public.chanda_collectors
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Regular users can only read chanda_collectors (SELECT only)
CREATE POLICY "Users can read chanda_collectors"
ON public.chanda_collectors
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- INITIAL DATA (OPTIONAL)
-- ============================================

-- Insert a default settings row if none exists
-- This ensures there's always a settings record to update
INSERT INTO public.jamaat_settings (
  jamaat_name,
  street,
  postal_code,
  city,
  phone,
  total_members,
  ansar_count,
  khuddam_count,
  tifl_count,
  lajna_count,
  nazarat_count
)
SELECT 
  'Jamaat Name',
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  0,
  0,
  0,
  0,
  0
WHERE NOT EXISTS (SELECT 1 FROM public.jamaat_settings);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify the tables and RLS are set up correctly:

-- 1. Check if tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('jamaat_settings', 'chanda_collectors');

-- 2. Check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('jamaat_settings', 'chanda_collectors');

-- 3. View all policies for these tables:
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('jamaat_settings', 'chanda_collectors');

-- 4. Test data retrieval (as admin):
-- SELECT * FROM public.jamaat_settings;
-- SELECT * FROM public.chanda_collectors;
