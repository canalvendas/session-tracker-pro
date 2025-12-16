import { Settings, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function IndependenceBanner() {
  const navigate = useNavigate();

  return (
    <Card variant="glass" className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-primary/5 to-transparent">
      {/* Decorative sparkles */}
      <div className="absolute top-2 right-2 opacity-30">
        <Sparkles className="h-8 w-8 text-emerald-500" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 flex-shrink-0">
            <span className="text-2xl">🏆</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground mb-1">
              Você é dono do seu tempo
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Configure suas clínicas e valores de sessão para ter controle total dos seus atendimentos.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/settings')}
              className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Ir para Configurações
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
