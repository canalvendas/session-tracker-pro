import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client com service role para operações admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Client com token do usuário para verificar permissões
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log('User auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é admin usando a função has_role
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.log('User is not admin:', user.id, roleError);
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // GET: Listar usuários pendentes
    if (req.method === 'GET' && action === 'pending') {
      console.log('Fetching pending users...');
      
      const { data: pendingUsers, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, full_name, is_paid, created_at, manager_id')
        .eq('is_paid', false)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching pending users:', fetchError);
        throw fetchError;
      }

      // Buscar emails e roles dos usuários
      const usersWithDetails = await Promise.all(
        (pendingUsers || []).map(async (profile) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
          const { data: roles } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);
          
          return {
            ...profile,
            email: authUser?.user?.email || 'Email não disponível',
            roles: roles?.map(r => r.role) || []
          };
        })
      );

      console.log(`Found ${usersWithDetails.length} pending users`);
      return new Response(JSON.stringify({ users: usersWithDetails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET: Listar todos os usuários
    if (req.method === 'GET' && action === 'all') {
      console.log('Fetching all users...');
      
      const { data: allUsers, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, full_name, is_paid, created_at, manager_id')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching all users:', fetchError);
        throw fetchError;
      }

      // Buscar emails e roles dos usuários
      const usersWithDetails = await Promise.all(
        (allUsers || []).map(async (profile) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
          const { data: roles } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);

          // Buscar nome do gestor se existir
          let managerName = null;
          if (profile.manager_id) {
            const { data: managerProfile } = await supabaseAdmin
              .from('profiles')
              .select('full_name')
              .eq('id', profile.manager_id)
              .single();
            managerName = managerProfile?.full_name;
          }
          
          return {
            ...profile,
            email: authUser?.user?.email || 'Email não disponível',
            roles: roles?.map(r => r.role) || [],
            manager_name: managerName
          };
        })
      );

      console.log(`Found ${usersWithDetails.length} total users`);
      return new Response(JSON.stringify({ users: usersWithDetails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET: Listar gestores
    if (req.method === 'GET' && action === 'managers') {
      console.log('Fetching managers...');
      
      const { data: managerRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'manager');

      if (rolesError) throw rolesError;

      const managerUserIds = managerRoles?.map(r => r.user_id) || [];
      
      if (managerUserIds.length === 0) {
        return new Response(JSON.stringify({ managers: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: managers, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, full_name, is_paid, created_at')
        .in('user_id', managerUserIds);

      if (fetchError) throw fetchError;

      // Contar profissionais vinculados a cada gestor
      const managersWithDetails = await Promise.all(
        (managers || []).map(async (manager) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(manager.user_id);
          const { count } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('manager_id', manager.id);
          
          return {
            ...manager,
            email: authUser?.user?.email || 'Email não disponível',
            professionals_count: count || 0
          };
        })
      );

      console.log(`Found ${managersWithDetails.length} managers`);
      return new Response(JSON.stringify({ managers: managersWithDetails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Aprovar usuário
    if (req.method === 'POST' && action === 'approve') {
      const { userId } = await req.json();
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Approving user:', userId);
      
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_paid: true })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error approving user:', updateError);
        throw updateError;
      }

      console.log('User approved successfully:', userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Revogar acesso
    if (req.method === 'POST' && action === 'revoke') {
      const { userId } = await req.json();
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Revoking user access:', userId);
      
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_paid: false })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error revoking user:', updateError);
        throw updateError;
      }

      console.log('User access revoked:', userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Definir role do usuário
    if (req.method === 'POST' && action === 'set-role') {
      const { userId, role } = await req.json();
      
      if (!userId || !role) {
        return new Response(JSON.stringify({ error: 'userId and role are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const validRoles = ['admin', 'manager', 'professional'];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: 'Invalid role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Setting role for user:', userId, role);

      // Remover roles existentes (exceto admin se for o admin principal)
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .neq('role', 'admin'); // Não remove admin existente

      if (deleteError) {
        console.error('Error removing old roles:', deleteError);
      }

      // Adicionar novo role
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });

      if (insertError) {
        console.error('Error setting role:', insertError);
        throw insertError;
      }

      console.log('Role set successfully:', userId, role);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Remover role do usuário
    if (req.method === 'POST' && action === 'remove-role') {
      const { userId, role } = await req.json();
      
      if (!userId || !role) {
        return new Response(JSON.stringify({ error: 'userId and role are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Removing role from user:', userId, role);

      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (deleteError) {
        console.error('Error removing role:', deleteError);
        throw deleteError;
      }

      console.log('Role removed successfully:', userId, role);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Vincular profissional a gestor
    if (req.method === 'POST' && action === 'assign-manager') {
      const { userId, managerId } = await req.json();
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Assigning manager to user:', userId, managerId);

      // Buscar profile_id do gestor (se managerId for null, remove vínculo)
      let managerProfileId = null;
      if (managerId) {
        const { data: managerProfile, error: managerError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('user_id', managerId)
          .single();

        if (managerError) {
          console.error('Error finding manager profile:', managerError);
          throw new Error('Manager profile not found');
        }
        managerProfileId = managerProfile.id;
      }

      // Atualizar o profile do profissional com o manager_id
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ manager_id: managerProfileId })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error assigning manager:', updateError);
        throw updateError;
      }

      console.log('Manager assigned successfully');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-users function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
