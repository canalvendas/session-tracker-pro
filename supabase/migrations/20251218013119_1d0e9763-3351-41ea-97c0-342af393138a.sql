-- Add column to track if professional has seen the payment
ALTER TABLE professional_payments 
ADD COLUMN seen_by_professional BOOLEAN DEFAULT FALSE;