import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, Calendar, Save, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Settings {
  sessionValue: number;
  weekStartsOn: 0 | 1;
}

interface SettingsPageProps {
  settings: Settings;
  updateSettings: (settings: Partial<{ session_value: number; week_starts_on: 0 | 1 }>) => void;
  signOut: () => Promise<{ error: any }>;
}

export function SettingsPage({ settings, updateSettings, signOut }: SettingsPageProps) {
  const [sessionValue, setSessionValue] = useState(settings.sessionValue.toString());
  const [weekStartsOn, setWeekStartsOn] = useState<"0" | "1">(settings.weekStartsOn.toString() as "0" | "1");
  const { toast } = useToast();

  const handleSave = () => {
    const value = parseFloat(sessionValue);
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para a sessão",
        variant: "destructive",
      });
      return;
    }

    updateSettings({
      session_value: value,
      week_starts_on: parseInt(weekStartsOn) as 0 | 1,
    });

    toast({
      title: "Configurações salvas!",
      description: "Suas preferências foram atualizadas com sucesso",
    });
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
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
        {/* Session Value */}
        <Card variant="elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Valor da Sessão
              </h2>
              <p className="text-xs text-muted-foreground">
                Defina quanto você cobra por sessão
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                R$
              </span>
              <Input
                type="number"
                value={sessionValue}
                onChange={(e) => setSessionValue(e.target.value)}
                className="pl-12 h-12 text-lg font-semibold"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Valor atual: {formatCurrency(settings.sessionValue)}
            </p>
          </div>
        </Card>

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
                Você pode editar ou excluir sessões individuais acessando o calendário e selecionando o dia desejado.
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
      </main>
    </div>
  );
}
