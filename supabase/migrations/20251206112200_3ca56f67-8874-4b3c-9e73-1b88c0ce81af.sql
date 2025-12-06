-- Criar tabela de clínicas
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  session_value numeric NOT NULL DEFAULT 40.00,
  color text NOT NULL DEFAULT '#3d8b7d',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clinics
CREATE POLICY "Users can view their own clinics" ON public.clinics 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clinics" ON public.clinics 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clinics" ON public.clinics 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clinics" ON public.clinics 
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar colunas na tabela sessions
ALTER TABLE public.sessions 
  ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL;

ALTER TABLE public.sessions 
  ADD COLUMN session_value numeric;