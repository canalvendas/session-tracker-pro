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
        // Check each role in order of priority
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (isAdmin) {
          setRole('admin');
          setLoading(false);
          return;
        }

        const { data: isManager } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'manager'
        });

        if (isManager) {
          setRole('manager');
          setLoading(false);
          return;
        }

        const { data: isProfessional } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'professional'
        });

        if (isProfessional) {
          setRole('professional');
          setLoading(false);
          return;
        }

        // Default to professional if no role assigned but user is paid
        setRole(null);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
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
