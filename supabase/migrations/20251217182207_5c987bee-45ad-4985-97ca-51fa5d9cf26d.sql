-- Add payment_type and shift_value columns to clinics table
ALTER TABLE public.clinics 
ADD COLUMN payment_type text NOT NULL DEFAULT 'session',
ADD COLUMN shift_value numeric NOT NULL DEFAULT 0;

-- Add constraint to validate payment_type values
ALTER TABLE public.clinics 
ADD CONSTRAINT clinics_valid_payment_type CHECK (payment_type IN ('session', 'shift'));

-- Add payment_type to sessions table for historical accuracy
ALTER TABLE public.sessions 
ADD COLUMN payment_type text DEFAULT 'session';

-- Add constraint to validate payment_type in sessions
ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_valid_payment_type CHECK (payment_type IN ('session', 'shift'));