-- Create quotes table for motivational quotes
-- This table stores inspirational quotes to motivate users for charity donations

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger for quotes
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION update_quotes_updated_at();

-- Enable RLS on quotes table
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read quotes
CREATE POLICY "Authenticated users can read quotes"
ON quotes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admins can do everything on quotes
CREATE POLICY "Admins have full access to quotes"
ON quotes
FOR ALL
TO authenticated
USING (public.is_admin());

-- Add comment to document the table
COMMENT ON TABLE public.quotes IS 'Motivational quotes to inspire users for charity donations';
