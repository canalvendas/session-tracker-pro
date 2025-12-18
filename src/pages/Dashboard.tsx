import { useState, useEffect, useMemo } from "react";
import { CalendarCheck, TrendingUp, Wallet } from "lucide-react";
import { PaymentConfirmationCard } from "@/components/PaymentConfirmationCard";
import { LinkedProfessionalHeader } from "@/components/LinkedProfessionalHeader";
import { IndependentProfessionalHeader } from "@/components/IndependentProfessionalHeader";
import { DailyProgressRing } from "@/components/DailyProgressRing";
import { QuickActionsGrid } from "@/components/QuickActionsGrid";
import { MotivationalMessage } from "@/components/MotivationalMessage";
import { PremiumStatCard, UnitType } from "@/components/PremiumStatCard";
import { AddSessionSheet } from "@/components/AddSessionSheet";
import { IndependenceBanner } from "@/components/IndependenceBanner";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { supabase } from "@/integrations/supabase/client";
import { Clinic, ShiftPeriod } from "@/types/clinic";

interface DashboardProps {
  stats: {
    daily: { sessions: number; shifts: number; value: number };
    weekly: { sessions: number; shifts: number; value: number };
    monthly: { sessions: number; shifts: number; value: number };
  };
  therapistName?: string | null;
  userId?: string;
  isLinkedProfessional?: boolean;
  // Props for AddSessionSheet
  addSession?: (date: Date, count: number, clinicId?: string, shiftPeriod?: ShiftPeriod) => Promise<any>;
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
  
  // Determine unit type based on clinics
  const unitType: UnitType = useMemo(() => {
    if (!clinics.length) return 'sessions';
    
    const hasSessionClinics = clinics.some(c => c.payment_type === 'session');
    const hasShiftClinics = clinics.some(c => c.payment_type === 'shift');
    
    if (hasSessionClinics && hasShiftClinics) return 'mixed';
    if (hasShiftClinics) return 'shifts';
    return 'sessions';
  }, [clinics]);

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
            shifts={stats.daily.shifts}
            value={stats.daily.value}
            icon={CalendarCheck}
            variant="primary"
            size="large"
            unitType={unitType}
          />

          {/* Week and Month Grid */}
          <div className="grid grid-cols-2 gap-4">
            <PremiumStatCard
              title="Esta semana"
              sessions={stats.weekly.sessions}
              shifts={stats.weekly.shifts}
              value={stats.weekly.value}
              icon={TrendingUp}
              variant="blue"
              size="small"
              unitType={unitType}
            />
            <PremiumStatCard
              title="Este mês"
              sessions={stats.monthly.sessions}
              shifts={stats.monthly.shifts}
              value={stats.monthly.value}
              icon={Wallet}
              variant="emerald"
              size="small"
              unitType={unitType}
            />
          </div>

          {/* Daily Progress Ring */}
          <DailyProgressRing 
            currentSessions={stats.daily.sessions} 
            currentShifts={stats.daily.shifts}
            goalSessions={5}
            unitType={unitType}
          />

          {/* Quick Actions */}
          <QuickActionsGrid 
            onRegisterSession={() => setIsAddSessionOpen(true)}
            showPayments={true}
          />

          {/* Push Notification Prompt */}
          {userId && (
            <PushNotificationPrompt userId={userId} />
          )}

          {/* Payment Confirmation Card */}
          {userId && (
            <PaymentConfirmationCard userId={userId} />
          )}

          {/* Motivational Message */}
          <MotivationalMessage 
            dailySessions={stats.daily.sessions + stats.daily.shifts}
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
          shifts={stats.daily.shifts}
          value={stats.daily.value}
          icon={CalendarCheck}
          variant="emerald"
          size="large"
          unitType={unitType}
        />

        {/* Week and Month Grid */}
        <div className="grid grid-cols-2 gap-4">
          <PremiumStatCard
            title="Esta semana"
            sessions={stats.weekly.sessions}
            shifts={stats.weekly.shifts}
            value={stats.weekly.value}
            icon={TrendingUp}
            variant="blue"
            size="small"
            unitType={unitType}
          />
          <PremiumStatCard
            title="Este mês"
            sessions={stats.monthly.sessions}
            shifts={stats.monthly.shifts}
            value={stats.monthly.value}
            icon={Wallet}
            variant="primary"
            size="small"
            unitType={unitType}
          />
        </div>

        {/* Daily Progress Ring */}
        <DailyProgressRing 
          currentSessions={stats.daily.sessions}
          currentShifts={stats.daily.shifts}
          goalSessions={5}
          unitType={unitType}
        />

        {/* Quick Actions */}
        <QuickActionsGrid 
          onRegisterSession={() => setIsAddSessionOpen(true)}
          showPayments={false}
        />

        {/* Motivational Message */}
        <MotivationalMessage 
          dailySessions={stats.daily.sessions + stats.daily.shifts}
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