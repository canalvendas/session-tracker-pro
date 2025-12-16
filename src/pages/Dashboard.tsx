import { useState, useEffect } from "react";
import { CalendarCheck, TrendingUp, Wallet } from "lucide-react";
import { PaymentConfirmationCard } from "@/components/PaymentConfirmationCard";
import { LinkedProfessionalHeader } from "@/components/LinkedProfessionalHeader";
import { IndependentProfessionalHeader } from "@/components/IndependentProfessionalHeader";
import { DailyProgressRing } from "@/components/DailyProgressRing";
import { QuickActionsGrid } from "@/components/QuickActionsGrid";
import { MotivationalMessage } from "@/components/MotivationalMessage";
import { PremiumStatCard } from "@/components/PremiumStatCard";
import { AddSessionSheet } from "@/components/AddSessionSheet";
import { IndependenceBanner } from "@/components/IndependenceBanner";
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

  // Independent Professional Dashboard (Premium Design)
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Premium Header */}
      <IndependentProfessionalHeader therapistName={therapistName} />

      <main className="px-5 space-y-5">
        {/* Today's KPI - Large Card */}
        <PremiumStatCard
          title="Hoje"
          sessions={stats.daily.sessions}
          value={stats.daily.value}
          icon={CalendarCheck}
          variant="emerald"
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
            variant="primary"
            size="small"
          />
        </div>

        {/* Daily Progress Ring */}
        <DailyProgressRing currentSessions={stats.daily.sessions} goalSessions={5} />

        {/* Quick Actions */}
        <QuickActionsGrid 
          onRegisterSession={() => setIsAddSessionOpen(true)}
          showPayments={false}
        />

        {/* Motivational Message */}
        <MotivationalMessage 
          dailySessions={stats.daily.sessions}
          weeklyValue={stats.weekly.value}
        />

        {/* Independence Banner */}
        <IndependenceBanner />
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
