-- Adicionar coluna is_paid na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN is_paid boolean NOT NULL DEFAULT false;