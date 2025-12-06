import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck, TrendingUp, Wallet, Calendar } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface DashboardProps {
  stats: {
    daily: { sessions: number; value: number };
    weekly: { sessions: number; value: number };
    monthly: { sessions: number; value: number };
  };
}

export function Dashboard({ stats }: DashboardProps) {
  const navigate = useNavigate();
  const today = new Date();
  
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
        <p className="text-sm text-muted-foreground font-medium mb-1">
          {format(today, "EEEE", { locale: ptBR })}
        </p>
        <h1 className="text-2xl font-bold text-foreground capitalize">
          {format(today, "d 'de' MMMM", { locale: ptBR })}
        </h1>
      </header>

      {/* Stats Grid */}
      <main className="px-5 space-y-4 stagger-children">
        {/* Today - Primary Card */}
        <StatCard
          title="Hoje"
          sessions={stats.daily.sessions}
          value={stats.daily.value}
          icon={CalendarCheck}
          variant="primary"
        />

        {/* Week and Month Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Esta semana"
            sessions={stats.weekly.sessions}
            value={stats.weekly.value}
            icon={TrendingUp}
            variant="secondary"
          />
          <StatCard
            title="Este mês"
            sessions={stats.monthly.sessions}
            value={stats.monthly.value}
            icon={Wallet}
            variant="secondary"
          />
        </div>

        {/* Quick Actions */}
        <Card variant="elevated" className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/calendar')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Calendar className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">Calendário</span>
            </button>
            <button 
              onClick={() => navigate('/history')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">Histórico</span>
            </button>
          </div>
        </Card>

        {/* Motivational Card */}
        {stats.daily.sessions > 0 && (
          <Card variant="glass" className="border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <span className="text-lg">🎉</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Ótimo trabalho hoje!
                </p>
                <p className="text-xs text-muted-foreground">
                  Você já realizou {stats.daily.sessions} {stats.daily.sessions === 1 ? 'sessão' : 'sessões'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
