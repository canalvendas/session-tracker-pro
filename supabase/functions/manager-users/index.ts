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

    // Verificar se é manager usando a função has_role
    const { data: isManager, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'manager'
    });

    if (roleError || !isManager) {
      console.log('User is not manager:', user.id, roleError);
      return new Response(JSON.stringify({ error: 'Forbidden - Manager access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // GET: Listar profissionais vinculados ao gestor
    if (req.method === 'GET' && action === 'professionals') {
      console.log('Fetching linked professionals for manager:', user.id);
      
      // Buscar profile do gestor
      const { data: managerProfile, error: managerError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (managerError || !managerProfile) {
        console.error('Error fetching manager profile:', managerError);
        throw new Error('Manager profile not found');
      }

      // Buscar profissionais vinculados
      const { data: professionals, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, full_name, is_paid, created_at, manager_id')
        .eq('manager_id', managerProfile.id)
        .order('full_name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching professionals:', fetchError);
        throw fetchError;
      }

      // Buscar emails dos profissionais
      const professionalsWithEmail = await Promise.all(
        (professionals || []).map(async (profile) => {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
          return {
            ...profile,
            email: authUser?.user?.email || 'Email não disponível'
          };
        })
      );

      console.log(`Found ${professionalsWithEmail.length} linked professionals`);
      return new Response(JSON.stringify({ professionals: professionalsWithEmail }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET: Sessões de um profissional específico
    if (req.method === 'GET' && action === 'sessions') {
      const professionalUserId = url.searchParams.get('userId');
      const month = url.searchParams.get('month');
      const year = url.searchParams.get('year');

      if (!professionalUserId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verificar se o profissional está vinculado ao gestor
      const { data: isLinked } = await supabaseAdmin.rpc('is_manager_of', {
        _manager_user_id: user.id,
        _professional_user_id: professionalUserId
      });

      if (!isLinked) {
        return new Response(JSON.stringify({ error: 'Professional not linked to this manager' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let query = supabaseAdmin
        .from('sessions')
        .select('id, date, count, session_value, clinic_id, created_at, clinics(id, name, color)')
        .eq('user_id', professionalUserId)
        .order('date', { ascending: false });

      // Filtrar por mês/ano se fornecido
      if (month && year) {
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data: sessions, error: sessionsError } = await query;

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      console.log(`Found ${sessions?.length || 0} sessions for professional ${professionalUserId}`);
      return new Response(JSON.stringify({ sessions: sessions || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET: Resumo consolidado de todos os profissionais
    if (req.method === 'GET' && action === 'summary') {
      const month = url.searchParams.get('month');
      const year = url.searchParams.get('year');

      console.log('Fetching summary for manager:', user.id, { month, year });

      // Buscar profile do gestor
      const { data: managerProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!managerProfile) {
        throw new Error('Manager profile not found');
      }

      // Buscar profissionais vinculados
      const { data: professionals, error: profError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, full_name')
        .eq('manager_id', managerProfile.id);

      if (profError) throw profError;

      // Para cada profissional, buscar sessões do período
      const summaries = await Promise.all(
        (professionals || []).map(async (prof) => {
          let query = supabaseAdmin
            .from('sessions')
            .select('count, session_value')
            .eq('user_id', prof.user_id);

          if (month && year) {
            const startDate = `${year}-${month.padStart(2, '0')}-01`;
            const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
            query = query.gte('date', startDate).lte('date', endDate);
          }

          const { data: sessions } = await query;

          const totalSessions = sessions?.reduce((sum, s) => sum + s.count, 0) || 0;
          const totalValue = sessions?.reduce((sum, s) => sum + (s.count * (s.session_value || 0)), 0) || 0;

          return {
            professional_id: prof.id,
            user_id: prof.user_id,
            full_name: prof.full_name,
            total_sessions: totalSessions,
            total_value: totalValue
          };
        })
      );

      const grandTotalSessions = summaries.reduce((sum, s) => sum + s.total_sessions, 0);
      const grandTotalValue = summaries.reduce((sum, s) => sum + s.total_value, 0);

      console.log(`Summary: ${professionals?.length || 0} professionals, ${grandTotalSessions} sessions, R$${grandTotalValue}`);
      
      return new Response(JSON.stringify({
        summaries,
        total_professionals: professionals?.length || 0,
        grand_total_sessions: grandTotalSessions,
        grand_total_value: grandTotalValue
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET: Pagamentos de um profissional
    if (req.method === 'GET' && action === 'payments') {
      const professionalId = url.searchParams.get('professionalId');

      if (!professionalId) {
        return new Response(JSON.stringify({ error: 'professionalId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar profile do gestor
      const { data: managerProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!managerProfile) {
        throw new Error('Manager profile not found');
      }

      // Buscar pagamentos
      const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('professional_payments')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('manager_id', managerProfile.id)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }

      console.log(`Found ${payments?.length || 0} payments for professional ${professionalId}`);
      return new Response(JSON.stringify({ payments: payments || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Registrar pagamento
    if (req.method === 'POST' && action === 'register-payment') {
      const body = await req.json();
      const { professionalId, amount, paymentDate, referenceMonth, referenceYear, notes } = body;

      console.log('Registering payment:', { professionalId, amount, paymentDate, referenceMonth, referenceYear });

      if (!professionalId || !amount || !paymentDate || !referenceMonth || !referenceYear) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar profile do gestor
      const { data: managerProfile, error: managerError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (managerError || !managerProfile) {
        console.error('Error fetching manager profile:', managerError);
        throw new Error('Manager profile not found');
      }

      // Verificar se o profissional está vinculado ao gestor
      const { data: professionalProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, manager_id')
        .eq('id', professionalId)
        .single();

      if (!professionalProfile || professionalProfile.manager_id !== managerProfile.id) {
        return new Response(JSON.stringify({ error: 'Professional not linked to this manager' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Inserir pagamento
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('professional_payments')
        .insert({
          professional_id: professionalId,
          manager_id: managerProfile.id,
          amount,
          payment_date: paymentDate,
          reference_month: referenceMonth,
          reference_year: referenceYear,
          notes
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error inserting payment:', paymentError);
        throw paymentError;
      }

      console.log('Payment registered successfully:', payment.id);
      return new Response(JSON.stringify({ success: true, payment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT: Atualizar pagamento
    if (req.method === 'PUT' && action === 'update-payment') {
      const body = await req.json();
      const { paymentId, amount, paymentDate, referenceMonth, referenceYear, notes } = body;

      console.log('Updating payment:', { paymentId, amount, paymentDate, referenceMonth, referenceYear });

      if (!paymentId || !amount || !paymentDate || !referenceMonth || !referenceYear) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar profile do gestor
      const { data: managerProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!managerProfile) {
        throw new Error('Manager profile not found');
      }

      // Verificar se o pagamento pertence ao gestor
      const { data: existingPayment } = await supabaseAdmin
        .from('professional_payments')
        .select('id, manager_id')
        .eq('id', paymentId)
        .single();

      if (!existingPayment || existingPayment.manager_id !== managerProfile.id) {
        return new Response(JSON.stringify({ error: 'Payment not found or not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Atualizar pagamento
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('professional_payments')
        .update({
          amount,
          payment_date: paymentDate,
          reference_month: referenceMonth,
          reference_year: referenceYear,
          notes
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (paymentError) {
        console.error('Error updating payment:', paymentError);
        throw paymentError;
      }

      console.log('Payment updated successfully:', payment.id);
      return new Response(JSON.stringify({ success: true, payment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE: Excluir pagamento
    if (req.method === 'DELETE' && action === 'delete-payment') {
      const paymentId = url.searchParams.get('paymentId');

      console.log('Deleting payment:', paymentId);

      if (!paymentId) {
        return new Response(JSON.stringify({ error: 'paymentId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar profile do gestor
      const { data: managerProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!managerProfile) {
        throw new Error('Manager profile not found');
      }

      // Verificar se o pagamento pertence ao gestor
      const { data: existingPayment } = await supabaseAdmin
        .from('professional_payments')
        .select('id, manager_id')
        .eq('id', paymentId)
        .single();

      if (!existingPayment || existingPayment.manager_id !== managerProfile.id) {
        return new Response(JSON.stringify({ error: 'Payment not found or not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Excluir pagamento
      const { error: deleteError } = await supabaseAdmin
        .from('professional_payments')
        .delete()
        .eq('id', paymentId);

      if (deleteError) {
        console.error('Error deleting payment:', deleteError);
        throw deleteError;
      }

      console.log('Payment deleted successfully:', paymentId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Criar novo profissional
    if (req.method === 'POST' && action === 'create-professional') {
      const body = await req.json();
      const { email, password, fullName } = body;

      console.log('Creating professional for manager:', user.id, { email, fullName });

      if (!email || !password || !fullName) {
        return new Response(JSON.stringify({ error: 'email, password and fullName are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Buscar profile do gestor
      const { data: managerProfile, error: managerError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (managerError || !managerProfile) {
        console.error('Error fetching manager profile:', managerError);
        throw new Error('Manager profile not found');
      }

      // Criar usuário no auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
          return new Response(JSON.stringify({ error: 'Este email já está cadastrado' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw createError;
      }

      if (!newUser.user) {
        throw new Error('User creation failed');
      }

      console.log('User created:', newUser.user.id);

      // Atualizar profile com manager_id e is_paid
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          manager_id: managerProfile.id,
          is_paid: true,
          full_name: fullName
        })
        .eq('user_id', newUser.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Rollback: deletar usuário criado
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        throw profileError;
      }

      // Adicionar role 'professional'
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role: 'professional' });

      if (roleError) {
        console.error('Error adding role:', roleError);
        // Não faz rollback aqui, profile já está configurado
      }

      console.log('Professional created successfully:', newUser.user.id);

      return new Response(JSON.stringify({ 
        success: true, 
        user_id: newUser.user.id,
        message: 'Professional created successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manager-users function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
