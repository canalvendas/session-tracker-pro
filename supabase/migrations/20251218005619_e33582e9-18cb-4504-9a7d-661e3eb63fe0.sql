-- Create security definer function to get manager profile id
CREATE OR REPLACE FUNCTION public.get_manager_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT manager_id 
  FROM public.profiles 
  WHERE user_id = _user_id
$$;

-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Linked professionals can view their manager profile" ON public.profiles;

-- Create new RLS policy using the security definer function
CREATE POLICY "Linked professionals can view their manager profile"
ON public.profiles FOR SELECT
USING (
  id = get_manager_profile_id(auth.uid())
);