import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Copy, Eye, UserPlus, RefreshCw, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RegisterProfessionalSheet } from "./RegisterProfessionalSheet";

interface Professional {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  is_paid: boolean;
}

export function ManagerProfessionalsSection() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Buscar código de convite (profile id do gestor)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (profile) {
        // Usar os primeiros 8 caracteres do UUID como código
        setInviteCode(profile.id.substring(0, 8).toUpperCase());
      }

      // Buscar profissionais vinculados via edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=professionals`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch professionals');
      }

      const result = await response.json();
      setProfessionals(result.professionals || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
      toast({
        title: "Erro ao carregar profissionais",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Envie para o profissional se cadastrar",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = (userId: string) => {
    navigate(`/manager/professional/${userId}`);
  };

  const handleProfessionalCreated = () => {
    fetchProfessionals();
    setIsSheetOpen(false);
  };

  return (
    <>
      <Card variant="elevated">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Gestão de Profissionais
              </h2>
              <p className="text-xs text-muted-foreground">
                Gerencie sua equipe de profissionais
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchProfessionals}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Código de Convite */}
        <div className="p-3 rounded-xl bg-muted/50 mb-4">
          <p className="text-xs text-muted-foreground mb-2">Código de Convite</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-lg font-bold text-primary tracking-wider">
              {inviteCode || '...'}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              disabled={!inviteCode}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Compartilhe este código com seus profissionais para vinculação
          </p>
        </div>

        {/* Lista de Profissionais */}
        {loading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          </div>
        ) : professionals.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum profissional vinculado
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre ou convide profissionais para começar
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {professionals.map((prof) => (
              <div
                key={prof.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {prof.full_name || 'Sem nome'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {prof.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewHistory(prof.user_id)}
                  className="ml-2 shrink-0"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Histórico</span>
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Botão Cadastrar */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsSheetOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Cadastrar Novo Profissional
        </Button>
      </Card>

      <RegisterProfessionalSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSuccess={handleProfessionalCreated}
      />
    </>
  );
}
