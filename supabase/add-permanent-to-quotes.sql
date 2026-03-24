-- Add permanent field to quotes table
-- This migration adds a permanent boolean column to allow admin to display important messages
-- that should not change until explicitly set to false or deleted

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS permanent BOOLEAN DEFAULT false;

-- Add comment to document the field
COMMENT ON COLUMN public.quotes.permanent IS 'When true, this quote will be displayed permanently on user home page until admin sets it to false or deletes it';

-- Add index for better query performance when filtering permanent quotes
CREATE INDEX IF NOT EXISTS idx_quotes_permanent ON public.quotes(permanent) WHERE permanent = true;
