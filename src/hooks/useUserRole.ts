import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'manager' | 'professional' | null;

interface UserRoleState {
  role: AppRole;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isProfessional: boolean;
}

export function useUserRole(user: User | null): UserRoleState {
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        // Check all roles in parallel for better performance
        const [adminResult, managerResult, professionalResult] = await Promise.all([
          supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
          supabase.rpc('has_role', { _user_id: user.id, _role: 'manager' }),
          supabase.rpc('has_role', { _user_id: user.id, _role: 'professional' }),
        ]);

        // Determine role based on priority
        if (adminResult.data) {
          setRole('admin');
        } else if (managerResult.data) {
          setRole('manager');
        } else if (professionalResult.data) {
          setRole('professional');
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isProfessional: role === 'professional' || role === null, // Default behavior
  };
}
