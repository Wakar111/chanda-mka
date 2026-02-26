-- Change charity_end column from text to date type in chanda_types table

-- First, update any existing text values to proper date format if needed
-- This will handle any existing data that might be in text format
UPDATE chanda_types
SET charity_end = NULL
WHERE charity_end IS NOT NULL 
  AND charity_end !~ '^\d{4}-\d{2}-\d{2}$';

-- Change the column type from text to date
ALTER TABLE chanda_types
ALTER COLUMN charity_end TYPE date USING charity_end::date;

-- Add comment to the column
COMMENT ON COLUMN chanda_types.charity_end IS 'End date (deadline) for the chanda payment';
