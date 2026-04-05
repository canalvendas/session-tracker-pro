
-- Fix 1: Remove the overly permissive SELECT policy on push_subscriptions
-- The "Service role can view all subscriptions" policy uses USING(true) on {public},
-- which means ANY user (even anonymous) can read all push subscription credentials.
-- Service role already bypasses RLS, so this policy is unnecessary.
DROP POLICY IF EXISTS "Service role can view all subscriptions" ON public.push_subscriptions;

-- Fix 2: Restrict manager_id on profiles INSERT and UPDATE
-- Prevent users from self-linking to arbitrary managers
CREATE OR REPLACE FUNCTION public.validate_manager_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow NULL manager_id (independent professionals)
  IF NEW.manager_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only allow setting manager_id if the target profile has the 'manager' role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.id = NEW.manager_id AND ur.role = 'manager'
  ) THEN
    RAISE EXCEPTION 'Invalid manager_id: target profile is not a manager';
  END IF;

  -- For INSERT: only service role or the manager themselves should set manager_id
  -- For regular users inserting their own profile, manager_id should be NULL
  IF TG_OP = 'INSERT' AND NEW.manager_id IS NOT NULL AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot self-assign a manager. Contact your manager or admin.';
  END IF;

  -- For UPDATE: only allow if the current user is an admin or the manager themselves
  IF TG_OP = 'UPDATE' AND OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
    IF NOT (
      has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.profiles m
        WHERE m.id = NEW.manager_id AND m.user_id = auth.uid()
      )
    ) THEN
      RAISE EXCEPTION 'Only admins or the manager can change manager_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS validate_manager_id_trigger ON public.profiles;

-- Create the trigger
CREATE TRIGGER validate_manager_id_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_manager_id();
