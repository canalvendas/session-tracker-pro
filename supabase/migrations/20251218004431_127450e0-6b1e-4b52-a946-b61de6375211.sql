-- Add max_professionals column to profiles table for managers
ALTER TABLE public.profiles 
ADD COLUMN max_professionals integer DEFAULT 10;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.max_professionals IS 'Maximum number of professionals a manager can register. Only applicable for manager role.';