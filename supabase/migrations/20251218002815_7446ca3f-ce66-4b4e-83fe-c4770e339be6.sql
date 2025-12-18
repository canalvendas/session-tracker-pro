-- Allow linked professionals to view their manager's profile
CREATE POLICY "Linked professionals can view their manager profile"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT manager_id FROM profiles 
    WHERE user_id = auth.uid() AND manager_id IS NOT NULL
  )
);