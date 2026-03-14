-- Create jamaat_promises table
-- This table stores Jamaat-wide promises for different Nizam (e.g., Tehrike Jadid, Waqfe Jadid)
CREATE TABLE IF NOT EXISTS jamaat_promises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nizam_name VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_promise DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_jamaat_promises_nizam ON jamaat_promises(nizam_name);

-- Enable Row Level Security
ALTER TABLE jamaat_promises ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to jamaat_promises"
ON jamaat_promises
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Allow regular users to read only
CREATE POLICY "Users can read jamaat_promises"
ON jamaat_promises
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'user'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_jamaat_promises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_jamaat_promises_timestamp
BEFORE UPDATE ON jamaat_promises
FOR EACH ROW
EXECUTE FUNCTION update_jamaat_promises_updated_at();

-- Insert sample data
INSERT INTO jamaat_promises (nizam_name, period_start, period_end, total_promise)
VALUES 
  ('Tehrike Jadid', '2026-01-01', '2026-12-31', 40000.00),
  ('Waqfe Jadid', '2026-01-01', '2026-12-31', 60000.00);
