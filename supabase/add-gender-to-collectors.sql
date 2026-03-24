-- Add gender field to chanda_collectors table
-- This migration adds a gender column with values restricted to 'male' or 'female'

ALTER TABLE public.chanda_collectors
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Add comment to document the field
COMMENT ON COLUMN public.chanda_collectors.gender IS 'Gender of the chanda collector: male or female';
