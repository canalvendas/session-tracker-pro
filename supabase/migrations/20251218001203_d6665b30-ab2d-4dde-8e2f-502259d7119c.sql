-- Allow linked professionals to view their manager's clinics
CREATE POLICY "Linked professionals can view manager clinics"
ON public.clinics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN profiles m ON p.manager_id = m.id
    WHERE p.user_id = auth.uid()
      AND m.user_id = clinics.user_id
  )
);