-- Migração 2: Funções e políticas RLS para o sistema de hierarquia

-- 1. Criar função para verificar se um usuário é gestor de outro
CREATE OR REPLACE FUNCTION public.is_manager_of(_manager_user_id UUID, _professional_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.profiles m ON m.id = p.manager_id
    WHERE p.user_id = _professional_user_id
      AND m.user_id = _manager_user_id
  )
$$;

-- 2. RLS: Permitir que gestores vejam sessões dos profissionais vinculados
CREATE POLICY "Managers can view linked professionals sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') 
  AND public.is_manager_of(auth.uid(), user_id)
);

-- 3. RLS: Permitir que gestores vejam profiles dos profissionais vinculados
CREATE POLICY "Managers can view linked professionals profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') 
  AND public.is_manager_of(auth.uid(), user_id)
);

-- 4. RLS: Permitir que gestores vejam clínicas dos profissionais vinculados
CREATE POLICY "Managers can view linked professionals clinics"
ON public.clinics
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') 
  AND public.is_manager_of(auth.uid(), user_id)
);

-- 5. RLS: Permitir que admins vejam todos os profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. RLS: Permitir que admins atualizem qualquer profile (para vincular manager_id)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. RLS: Permitir que admins vejam todas as sessões
CREATE POLICY "Admins can view all sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. RLS: Permitir que admins vejam todas as clínicas
CREATE POLICY "Admins can view all clinics"
ON public.clinics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));