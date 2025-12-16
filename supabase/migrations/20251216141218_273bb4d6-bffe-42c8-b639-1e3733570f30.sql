-- Migração 1: Adicionar novos valores ao enum e coluna manager_id
-- (as funções e policies serão criadas em migração separada)

-- 1. Adicionar novos valores ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professional';

-- 2. Adicionar coluna manager_id na tabela profiles para vincular profissional ao gestor
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Criar índice para melhorar performance de consultas por manager_id
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);