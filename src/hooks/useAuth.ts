import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { unregisterAllServiceWorkers } from '@/lib/swCleanup';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      return { data, error };
    } catch (e: any) {
      // Network/service-worker failures surface as "Failed to fetch"
      return {
        data: null,
        error: {
          message:
            'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
        },
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Sempre limpa o estado local, independente do erro
      setUser(null);
      setSession(null);
      
      return { error };
    } catch (e: any) {
      // Em caso de erro de rede, ainda limpa localmente
      setUser(null);
      setSession(null);
      return { error: e };
    }
  }, []);

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
