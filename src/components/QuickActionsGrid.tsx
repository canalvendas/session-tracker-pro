import { Calendar, History, Plus, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface QuickActionsGridProps {
  onRegisterSession: () => void;
  showPayments?: boolean;
}

export function QuickActionsGrid({ onRegisterSession, showPayments = false }: QuickActionsGridProps) {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: "Registrar Sessão",
      description: "Adicionar agora",
      onClick: onRegisterSession,
      variant: "primary" as const,
    },
    {
      icon: Calendar,
      label: "Calendário",
      description: "Ver agenda",
      onClick: () => navigate('/calendar'),
      variant: "default" as const,
    },
    {
      icon: History,
      label: "Histórico",
      description: "Ver sessões",
      onClick: () => navigate('/history'),
      variant: "default" as const,
    },
    ...(showPayments ? [{
      icon: CreditCard,
      label: "Pagamentos",
      description: "Ver recebidos",
      onClick: () => navigate('/pagamentos'),
      variant: "default" as const,
    }] : [{
      icon: History,
      label: "Relatórios",
      description: "Ver dados",
      onClick: () => navigate('/history'),
      variant: "default" as const,
    }]),
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Ações Rápidas
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              action.variant === "primary"
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            {/* Shine effect for primary */}
            {action.variant === "primary" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}
            
            <div className="relative z-10">
              <div className={`inline-flex p-2 rounded-lg mb-2 ${
                action.variant === "primary" 
                  ? "bg-white/20" 
                  : "bg-primary/10"
              }`}>
                <action.icon className={`h-5 w-5 ${
                  action.variant === "primary" 
                    ? "text-primary-foreground" 
                    : "text-primary"
                }`} />
              </div>
              <p className={`text-sm font-semibold ${
                action.variant === "primary" 
                  ? "text-primary-foreground" 
                  : "text-foreground"
              }`}>
                {action.label}
              </p>
              <p className={`text-xs ${
                action.variant === "primary" 
                  ? "text-primary-foreground/70" 
                  : "text-muted-foreground"
              }`}>
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
