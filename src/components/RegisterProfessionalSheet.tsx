import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Lock, Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { z } from "zod";

interface RegisterProfessionalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres");

export function RegisterProfessionalSheet({
  open,
  onOpenChange,
  onSuccess,
}: RegisterProfessionalSheetProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [limitError, setLimitError] = useState<string | null>(null);
  const { toast } = useToast();

  const validate = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Nome é obrigatório";
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    setLimitError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=create-professional`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Verificar se é erro de limite
        if (result.code === 'LIMIT_REACHED' || response.status === 403) {
          setLimitError(result.error || 'Você atingiu o limite de profissionais do seu plano.');
          return;
        }
        throw new Error(result.error || 'Erro ao cadastrar profissional');
      }

      toast({
        title: "Profissional cadastrado!",
        description: `${fullName} foi adicionado à sua equipe`,
      });

      // Reset form
      setFullName("");
      setEmail("");
      setPassword("");
      setErrors({});
      setLimitError(null);
      
      onSuccess();
    } catch (error) {
      console.error('Error creating professional:', error);
      toast({
        title: "Erro ao cadastrar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setFullName("");
      setEmail("");
      setPassword("");
      setErrors({});
      setLimitError(null);
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh]">
        <SheetHeader className="mb-6">
          <SheetTitle>Cadastrar Profissional</SheetTitle>
          <SheetDescription>
            Adicione um novo profissional à sua equipe. Ele terá acesso imediato ao app.
          </SheetDescription>
        </SheetHeader>

        {limitError && (
          <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Limite atingido</p>
                <p className="text-xs text-destructive/80 mt-1">{limitError}</p>
                <a 
                  href="https://wa.me/5581986953506?text=Olá! Gostaria de ampliar meu plano TeraDay para cadastrar mais profissionais."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-primary underline hover:no-underline"
                >
                  Falar com suporte via WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prof-name">Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="prof-name"
                type="text"
                placeholder="Nome do profissional"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 h-12"
                disabled={loading || !!limitError}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="prof-email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                disabled={loading || !!limitError}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-password">Senha temporária</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="prof-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12"
                disabled={loading || !!limitError}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading || !!limitError}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              O profissional poderá alterar a senha depois
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-6"
            disabled={loading || !!limitError}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Cadastrar Profissional"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
