-- Add shift_period column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN shift_period text DEFAULT NULL;

-- Add check constraint for valid shift period values
ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_shift_period_check 
CHECK (shift_period IS NULL OR shift_period IN ('morning', 'afternoon', 'full_day'));