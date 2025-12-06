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
        .select('id, user_id, full_name, is_paid, created_at')
        .eq('is_paid', false)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching pending users:', fetchError);
        throw fetchError;
      }

      // Buscar emails dos usuários
      const usersWithEmail = await Promise.all(
        (pendingUsers || []).map(async (profile) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
          return {
            ...profile,
            email: authUser?.user?.email || 'Email não disponível'
          };
        })
      );

      console.log(`Found ${usersWithEmail.length} pending users`);
      return new Response(JSON.stringify({ users: usersWithEmail }), {
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

    // GET: Listar todos os usuários
    if (req.method === 'GET' && action === 'all') {
      console.log('Fetching all users...');
      
      const { data: allUsers, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, full_name, is_paid, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching all users:', fetchError);
        throw fetchError;
      }

      // Buscar emails dos usuários
      const usersWithEmail = await Promise.all(
        (allUsers || []).map(async (profile) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
          return {
            ...profile,
            email: authUser?.user?.email || 'Email não disponível'
          };
        })
      );

      console.log(`Found ${usersWithEmail.length} total users`);
      return new Response(JSON.stringify({ users: usersWithEmail }), {
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
