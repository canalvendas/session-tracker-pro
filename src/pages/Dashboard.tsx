import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck, TrendingUp, Wallet, Calendar } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { PaymentConfirmationCard } from "@/components/PaymentConfirmationCard";
import { LinkedProfessionalHeader } from "@/components/LinkedProfessionalHeader";
import { DailyProgressRing } from "@/components/DailyProgressRing";
import { QuickActionsGrid } from "@/components/QuickActionsGrid";
import { MotivationalMessage } from "@/components/MotivationalMessage";
import { PremiumStatCard } from "@/components/PremiumStatCard";
import { AddSessionSheet } from "@/components/AddSessionSheet";
import { supabase } from "@/integrations/supabase/client";
import { Clinic } from "@/types/clinic";

interface DashboardProps {
  stats: {
    daily: { sessions: number; value: number };
    weekly: { sessions: number; value: number };
    monthly: { sessions: number; value: number };
  };
  therapistName?: string | null;
  userId?: string;
  isLinkedProfessional?: boolean;
  // Props for AddSessionSheet
  addSession?: (date: Date, count: number, clinicId?: string) => Promise<any>;
  sessionValue?: number;
  clinics?: Clinic[];
  defaultClinic?: Clinic | null;
}

export function Dashboard({ 
  stats, 
  therapistName, 
  userId, 
  isLinkedProfessional,
  addSession,
  sessionValue = 40,
  clinics = [],
  defaultClinic = null,
}: DashboardProps) {
  const navigate = useNavigate();
  const today = new Date();
  const firstName = therapistName?.split(' ')[0];
  const [managerName, setManagerName] = useState<string | null>(null);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  
  // Fetch manager name for linked professionals
  useEffect(() => {
    const fetchManagerName = async () => {
      if (!isLinkedProfessional || !userId) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('manager_id')
        .eq('user_id', userId)
        .single();
      
      if (profile?.manager_id) {
        const { data: manager } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', profile.manager_id)
          .single();
        
        if (manager?.full_name) {
          setManagerName(manager.full_name);
        }
      }
    };
    
    fetchManagerName();
  }, [isLinkedProfessional, userId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Linked Professional Dashboard (Premium Design)
  if (isLinkedProfessional) {
    return (
      <div className="min-h-screen bg-background pb-32">
        {/* Premium Header */}
        <LinkedProfessionalHeader 
          therapistName={therapistName} 
          managerName={managerName}
        />

        <main className="px-5 space-y-5">
          {/* Today's KPI - Large Card */}
          <PremiumStatCard
            title="Hoje"
            sessions={stats.daily.sessions}
            value={stats.daily.value}
            icon={CalendarCheck}
            variant="primary"
            size="large"
          />

          {/* Week and Month Grid */}
          <div className="grid grid-cols-2 gap-4">
            <PremiumStatCard
              title="Esta semana"
              sessions={stats.weekly.sessions}
              value={stats.weekly.value}
              icon={TrendingUp}
              variant="blue"
              size="small"
            />
            <PremiumStatCard
              title="Este mês"
              sessions={stats.monthly.sessions}
              value={stats.monthly.value}
              icon={Wallet}
              variant="emerald"
              size="small"
            />
          </div>

          {/* Daily Progress Ring */}
          <DailyProgressRing currentSessions={stats.daily.sessions} goalSessions={5} />

          {/* Quick Actions */}
          <QuickActionsGrid 
            onRegisterSession={() => setIsAddSessionOpen(true)}
            showPayments={true}
          />

          {/* Payment Confirmation Card */}
          {userId && (
            <PaymentConfirmationCard userId={userId} />
          )}

          {/* Motivational Message */}
          <MotivationalMessage 
            dailySessions={stats.daily.sessions}
            weeklyValue={stats.weekly.value}
          />
        </main>

        {/* Add Session Sheet */}
        {addSession && (
          <AddSessionSheet 
            open={isAddSessionOpen} 
            onOpenChange={setIsAddSessionOpen}
            onAddSession={addSession}
            sessionValue={sessionValue}
            clinics={clinics}
            defaultClinic={defaultClinic}
          />
        )}
      </div>
    );
  }

  // Standard Dashboard (Independent Professionals)
  return (
    <div className="min-h-screen gradient-surface pb-32">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        {firstName && (
          <p className="text-lg font-semibold text-foreground mb-2">
            Olá, {firstName}! 👋
          </p>
        )}
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
