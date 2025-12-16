import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, Save, LogOut, Moon, Sun, Monitor, Shield, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClinicManager } from "@/components/ClinicManager";
import { ManagerProfessionalsSection } from "@/components/ManagerProfessionalsSection";
import { Clinic, ClinicFormData } from "@/types/clinic";

interface Settings {
  sessionValue: number;
  weekStartsOn: 0 | 1;
}

interface SettingsPageProps {
  settings: Settings;
  updateSettings: (settings: Partial<{ session_value: number; week_starts_on: 0 | 1 }>) => void;
  signOut: () => Promise<{ error: any }>;
  clinics: Clinic[];
  onAddClinic: (data: ClinicFormData) => Promise<Clinic | null>;
  onUpdateClinic: (id: string, data: ClinicFormData) => Promise<void>;
  onDeleteClinic: (id: string) => Promise<void>;
  isLinkedProfessional?: boolean;
}

export function SettingsPage({ 
  settings, 
  updateSettings, 
  signOut,
  clinics,
  onAddClinic,
  onUpdateClinic,
  onDeleteClinic,
  isLinkedProfessional = false,
}: SettingsPageProps) {
  const [weekStartsOn, setWeekStartsOn] = useState<"0" | "1">(settings.weekStartsOn.toString() as "0" | "1");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [adminResult, managerResult] = await Promise.all([
          supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
          supabase.rpc('has_role', { _user_id: user.id, _role: 'manager' }),
        ]);
        setIsAdmin(adminResult.data === true);
        setIsManager(managerResult.data === true);
      }
    };
    checkRoles();
  }, []);

  const handleSave = () => {
    updateSettings({
      week_starts_on: parseInt(weekStartsOn) as 0 | 1,
    });

    toast({
      title: "Configurações salvas!",
      description: "Suas preferências foram atualizadas com sucesso",
    });
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    
    const isSessionError = 
      !error ||
      error?.code === 'session_not_found' ||
      error?.message?.toLowerCase().includes('session') ||
      error?.message?.toLowerCase().includes('missing');
    
    if (isSessionError) {
      localStorage.clear();
      window.location.href = '/';
      return;
    }
    
    toast({
      title: "Erro ao sair",
      description: error.message,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen gradient-surface pb-32">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize o app de acordo com suas preferências
        </p>
      </header>

      <main className="px-5 space-y-5">
        {/* Manager Professionals Section - Only visible to managers */}
        {isManager && <ManagerProfessionalsSection />}

        {/* Clinic Manager - Hidden for professionals linked to managers */}
        {!isLinkedProfessional ? (
          <ClinicManager
            clinics={clinics}
            onAdd={onAddClinic}
            onUpdate={onUpdateClinic}
            onDelete={onDeleteClinic}
          />
        ) : (
          <Card variant="glass" className="border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Clínicas Gerenciadas
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Suas clínicas e valores de sessão são gerenciados pelo seu gestor.
                </p>
              </div>
            </div>
          </Card>
        )}
        {/* Week Start */}
        <Card variant="elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Início da Semana
              </h2>
              <p className="text-xs text-muted-foreground">
                Escolha qual dia começa sua semana
              </p>
            </div>
          </div>

          <RadioGroup
            value={weekStartsOn}
            onValueChange={(value) => setWeekStartsOn(value as "0" | "1")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <RadioGroupItem value="1" id="monday" />
              <Label htmlFor="monday" className="flex-1 cursor-pointer font-medium">
                Segunda-feira
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <RadioGroupItem value="0" id="sunday" />
              <Label htmlFor="sunday" className="flex-1 cursor-pointer font-medium">
                Domingo
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Theme Settings */}
        <Card variant="elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Aparência
              </h2>
              <p className="text-xs text-muted-foreground">
                Escolha o tema do aplicativo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                theme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 hover:bg-muted text-foreground"
              }`}
            >
              <Sun className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Claro</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                theme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 hover:bg-muted text-foreground"
              }`}
            >
              <Moon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Escuro</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                theme === "system"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 hover:bg-muted text-foreground"
              }`}
            >
              <Monitor className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Sistema</span>
            </button>
          </div>
        </Card>

        {/* Admin Panel Link - Only visible to admins */}
        {isAdmin && (
          <Card variant="elevated">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Painel Admin
                </h2>
                <p className="text-xs text-muted-foreground">
                  Gerencie usuários e acessos
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/admin')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Acessar Painel Admin
            </Button>
          </Card>
        )}

        {/* Info Card */}
        <Card variant="glass" className="border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Dica
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Agora você pode ter múltiplas clínicas com valores diferentes! Ao registrar uma sessão, selecione a clínica correspondente.
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button size="xl" className="w-full" onClick={handleSave}>
          <Save className="h-5 w-5 mr-2" />
          Salvar Configurações
        </Button>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sair da conta
        </Button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          TeraDay v1.2.0
        </p>
      </main>
    </div>
  );
}
