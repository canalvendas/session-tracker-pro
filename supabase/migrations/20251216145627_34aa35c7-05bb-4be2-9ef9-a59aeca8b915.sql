-- Create professional_payments table
CREATE TABLE public.professional_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  reference_month INTEGER NOT NULL CHECK (reference_month >= 1 AND reference_month <= 12),
  reference_year INTEGER NOT NULL CHECK (reference_year >= 2020 AND reference_year <= 2100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professional_payments ENABLE ROW LEVEL SECURITY;

-- Professionals can view their own payments
CREATE POLICY "Professionals can view own payments"
  ON public.professional_payments FOR SELECT
  USING (professional_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Managers can view payments they created
CREATE POLICY "Managers can view own created payments"
  ON public.professional_payments FOR SELECT
  USING (manager_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Managers can insert payments for their linked professionals
CREATE POLICY "Managers can insert payments"
  ON public.professional_payments FOR INSERT
  WITH CHECK (manager_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Managers can update their own payments
CREATE POLICY "Managers can update own payments"
  ON public.professional_payments FOR UPDATE
  USING (manager_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Managers can delete their own payments
CREATE POLICY "Managers can delete own payments"
  ON public.professional_payments FOR DELETE
  USING (manager_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_professional_payments_updated_at
  BEFORE UPDATE ON public.professional_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();