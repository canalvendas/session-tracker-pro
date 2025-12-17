import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { Clinic, ClinicFormData, ShiftPeriod } from '@/types/clinic';

interface Session {
  id: string;
  date: string;
  count: number;
  created_at: string;
  clinic_id: string | null;
  session_value: number | null;
  payment_type: 'session' | 'shift' | null;
  shift_period: ShiftPeriod | null;
}

interface Profile {
  session_value: number;
  week_starts_on: 0 | 1;
  full_name: string | null;
  is_paid: boolean;
  manager_id: string | null;
}

interface Stats {
  daily: { sessions: number; value: number };
  weekly: { sessions: number; value: number };
  monthly: { sessions: number; value: number };
}

interface DayRecord {
  date: string;
  sessions: number;
  value: number;
}

export function useSupabaseSessionStore(user: User | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [profile, setProfile] = useState<Profile>({
    session_value: 40,
    week_starts_on: 1,
    full_name: null,
    is_paid: false,
    manager_id: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch sessions, clinics and profile
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setClinics([]);
      setIsLoaded(true);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch all data in parallel for better performance
        const [sessionsResult, clinicsResult, profileResult] = await Promise.all([
          supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false }),
          supabase
            .from('clinics')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('profiles')
            .select('session_value, week_starts_on, full_name, is_paid, manager_id')
            .eq('user_id', user.id)
            .single(),
        ]);

        if (sessionsResult.error) throw sessionsResult.error;
        setSessions((sessionsResult.data || []) as Session[]);

        if (clinicsResult.error) throw clinicsResult.error;
        setClinics((clinicsResult.data || []) as Clinic[]);

        if (profileResult.error && profileResult.error.code !== 'PGRST116') {
          throw profileResult.error;
        }

        if (profileResult.data) {
          setProfile({
            session_value: Number(profileResult.data.session_value),
            week_starts_on: profileResult.data.week_starts_on as 0 | 1,
            full_name: profileResult.data.full_name,
            is_paid: profileResult.data.is_paid ?? false,
            manager_id: profileResult.data.manager_id ?? null,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [user]);

  // Get default clinic
  const getDefaultClinic = useCallback((): Clinic | null => {
    if (clinics.length === 0) return null;
    const defaultClinic = clinics.find(c => c.is_default);
    return defaultClinic || clinics[0];
  }, [clinics]);

  // Get total value for a session (considering payment type)
  const getSessionTotalValue = useCallback((session: Session): number => {
    // For shift payment, the stored session_value IS the total value (not per-session)
    if (session.payment_type === 'shift') {
      return session.session_value ?? 0;
    }
    
    // For session payment, multiply count by per-session value
    if (session.session_value != null) {
      return session.count * session.session_value;
    }
    if (session.clinic_id) {
      const clinic = clinics.find(c => c.id === session.clinic_id);
      if (clinic) {
        if (clinic.payment_type === 'shift') {
          return clinic.shift_value;
        }
        return session.count * clinic.session_value;
      }
    }
    return session.count * profile.session_value;
  }, [clinics, profile.session_value]);

  // Get per-session value (for backward compatibility)
  const getSessionValue = useCallback((session: Session): number => {
    if (session.payment_type === 'shift') {
      // For shift, return the total value divided by count to get "per session" equivalent
      return (session.session_value ?? 0) / (session.count || 1);
    }
    if (session.session_value != null) {
      return session.session_value;
    }
    if (session.clinic_id) {
      const clinic = clinics.find(c => c.id === session.clinic_id);
      if (clinic) return clinic.session_value;
    }
    return profile.session_value;
  }, [clinics, profile.session_value]);

  // Clinic management
  const addClinic = useCallback(async (data: ClinicFormData): Promise<Clinic | null> => {
    if (!user) return null;

    // If setting as default, unset other defaults first
    if (data.is_default && clinics.some(c => c.is_default)) {
      await supabase
        .from('clinics')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data: newClinic, error } = await supabase
      .from('clinics')
      .insert({
        user_id: user.id,
        name: data.name,
        session_value: data.session_value,
        shift_value: data.shift_value,
        payment_type: data.payment_type,
        color: data.color,
        is_default: data.is_default || clinics.length === 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding clinic:', error);
      return null;
    }

    const typedClinic = newClinic as Clinic;
    setClinics(prev => {
      if (typedClinic.is_default) {
        return [...prev.map(c => ({ ...c, is_default: false })), typedClinic];
      }
      return [...prev, typedClinic];
    });
    return typedClinic;
  }, [user, clinics]);

  const updateClinic = useCallback(async (id: string, data: ClinicFormData) => {
    if (!user) return;

    // If setting as default, unset other defaults first
    if (data.is_default) {
      await supabase
        .from('clinics')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', id);
    }

    const { data: updatedClinic, error } = await supabase
      .from('clinics')
      .update({
        name: data.name,
        session_value: data.session_value,
        shift_value: data.shift_value,
        payment_type: data.payment_type,
        color: data.color,
        is_default: data.is_default,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating clinic:', error);
      return;
    }

    const typedUpdatedClinic = updatedClinic as Clinic;
    setClinics(prev => {
      if (data.is_default) {
        return prev.map(c => c.id === id ? typedUpdatedClinic : { ...c, is_default: false });
      }
      return prev.map(c => c.id === id ? typedUpdatedClinic : c);
    });
  }, [user]);

  const deleteClinic = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('clinics')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting clinic:', error);
      return;
    }

    setClinics(prev => {
      const remaining = prev.filter(c => c.id !== id);
      // If deleted clinic was default and there are others, set first as default
      if (prev.find(c => c.id === id)?.is_default && remaining.length > 0) {
        remaining[0] = { ...remaining[0], is_default: true };
        // Update in database
        supabase
          .from('clinics')
          .update({ is_default: true })
          .eq('id', remaining[0].id)
          .eq('user_id', user.id);
      }
      return remaining;
    });
  }, [user]);

  // Session management with clinic support
  const addSession = useCallback(async (date: Date, count: number = 1, clinicId?: string, shiftPeriod?: ShiftPeriod) => {
    if (!user) return null;

    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Determine clinic and session value
    let clinic: Clinic | null = null;
    if (clinicId) {
      clinic = clinics.find(c => c.id === clinicId) || null;
    } else {
      clinic = getDefaultClinic();
    }

    // Determine payment type and value based on clinic
    const paymentType = clinic?.payment_type ?? 'session';
    
    // For shift payment with period: morning/afternoon = 1x value, full_day = 2x value
    let sessionValue: number;
    let actualCount = count;
    
    if (paymentType === 'shift') {
      const baseShiftValue = clinic?.shift_value ?? 0;
      if (shiftPeriod === 'full_day') {
        sessionValue = baseShiftValue * 2; // Full day = 2x shift value
        actualCount = 2; // Count as 2 shifts
      } else {
        sessionValue = baseShiftValue;
        actualCount = 1; // Morning or afternoon = 1 shift
      }
    } else {
      sessionValue = clinic?.session_value ?? profile.session_value;
    }
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        date: dateStr,
        count: actualCount,
        clinic_id: clinic?.id || null,
        session_value: sessionValue,
        payment_type: paymentType,
        shift_period: shiftPeriod || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding session:', error);
      return null;
    }

    setSessions(prev => [data as Session, ...prev]);
    return data as Session;
  }, [user, clinics, getDefaultClinic, profile.session_value]);

  const deleteSession = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting session:', error);
      return;
    }

    setSessions(prev => prev.filter(s => s.id !== id));
  }, [user]);

  const updateSession = useCallback(async (id: string, count: number, clinicId?: string) => {
    if (!user) return;

    const updateData: { count: number; clinic_id?: string | null; session_value?: number } = { count };
    
    if (clinicId !== undefined) {
      const clinic = clinics.find(c => c.id === clinicId);
      updateData.clinic_id = clinicId || null;
      updateData.session_value = clinic?.session_value ?? profile.session_value;
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return;
    }

    setSessions(prev => prev.map(s => s.id === id ? data as Session : s));
  }, [user, clinics, profile.session_value]);

  const getSessionsForDate = useCallback((date: Date): Session[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr);
  }, [sessions]);

  const getTotalForDate = useCallback((date: Date): number => {
    return getSessionsForDate(date).reduce((sum, s) => sum + s.count, 0);
  }, [getSessionsForDate]);

  // Check if date has shift-type sessions
  const hasShiftsOnDate = useCallback((date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.some(s => s.date === dateStr && s.payment_type === 'shift');
  }, [sessions]);

  // Check if date has both session and shift types (mixed)
  const hasMixedOnDate = useCallback((date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateSessions = sessions.filter(s => s.date === dateStr);
    const hasShift = dateSessions.some(s => s.payment_type === 'shift');
    const hasSession = dateSessions.some(s => s.payment_type !== 'shift');
    return hasShift && hasSession;
  }, [sessions]);

  const getStats = useCallback((referenceDate: Date = new Date()): Stats => {
    const today = format(referenceDate, 'yyyy-MM-dd');
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: profile.week_starts_on });
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: profile.week_starts_on });
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);

    let dailySessions = 0;
    let dailyValue = 0;
    let weeklySessions = 0;
    let weeklyValue = 0;
    let monthlySessions = 0;
    let monthlyValue = 0;

    sessions.forEach(session => {
      const sessionDate = parseISO(session.date);
      const totalValue = getSessionTotalValue(session);
      
      if (session.date === today) {
        dailySessions += session.count;
        dailyValue += totalValue;
      }
      
      if (isWithinInterval(sessionDate, { start: weekStart, end: weekEnd })) {
        weeklySessions += session.count;
        weeklyValue += totalValue;
      }
      
      if (isWithinInterval(sessionDate, { start: monthStart, end: monthEnd })) {
        monthlySessions += session.count;
        monthlyValue += totalValue;
      }
    });

    return {
      daily: { sessions: dailySessions, value: dailyValue },
      weekly: { sessions: weeklySessions, value: weeklyValue },
      monthly: { sessions: monthlySessions, value: monthlyValue },
    };
  }, [sessions, profile, getSessionTotalValue]);

  const getMonthlyHistory = useCallback((year: number, month: number): DayRecord[] => {
    const startDate = new Date(year, month, 1);
    const endDate = endOfMonth(startDate);
    
    const dailyTotals: Record<string, { sessions: number; value: number }> = {};
    
    sessions.forEach(session => {
      const sessionDate = parseISO(session.date);
      if (isWithinInterval(sessionDate, { start: startDate, end: endDate })) {
        if (!dailyTotals[session.date]) {
          dailyTotals[session.date] = { sessions: 0, value: 0 };
        }
        dailyTotals[session.date].sessions += session.count;
        dailyTotals[session.date].value += getSessionTotalValue(session);
      }
    });

    return Object.entries(dailyTotals)
      .map(([date, data]) => ({
        date,
        sessions: data.sessions,
        value: data.value,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, getSessionTotalValue]);

  const getWeeklyHistory = useCallback((year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = endOfMonth(monthStart);
    
    const weeks: { weekStart: Date; weekEnd: Date; sessions: number; value: number }[] = [];
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: profile.week_starts_on });
    
    while (currentWeekStart <= monthEnd) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: profile.week_starts_on });
      let weekSessions = 0;
      let weekValue = 0;
      
      sessions.forEach(session => {
        const sessionDate = parseISO(session.date);
        if (isWithinInterval(sessionDate, { start: currentWeekStart, end: currentWeekEnd })) {
          weekSessions += session.count;
          weekValue += getSessionTotalValue(session);
        }
      });
      
      if (weekSessions > 0) {
        weeks.push({
          weekStart: currentWeekStart,
          weekEnd: currentWeekEnd,
          sessions: weekSessions,
          value: weekValue,
        });
      }
      
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  }, [sessions, profile, getSessionTotalValue]);

  const getYearlyHistory = useCallback((year: number) => {
    const monthlyTotals: { month: number; sessions: number; value: number }[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = endOfMonth(monthStart);
      let monthSessions = 0;
      let monthValue = 0;
      
      sessions.forEach(session => {
        const sessionDate = parseISO(session.date);
        if (isWithinInterval(sessionDate, { start: monthStart, end: monthEnd })) {
          monthSessions += session.count;
          monthValue += getSessionTotalValue(session);
        }
      });
      
      monthlyTotals.push({
        month,
        sessions: monthSessions,
        value: monthValue,
      });
    }
    
    return monthlyTotals;
  }, [sessions, getSessionTotalValue]);

  const updateSettings = useCallback(async (newSettings: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        session_value: newSettings.session_value,
        week_starts_on: newSettings.week_starts_on,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating settings:', error);
      return;
    }

    setProfile(prev => ({ ...prev, ...newSettings }));
  }, [user]);

  const hasSessionsOnDate = useCallback((date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.some(s => s.date === dateStr);
  }, [sessions]);

  // Get clinic by ID
  const getClinicById = useCallback((id: string): Clinic | undefined => {
    return clinics.find(c => c.id === id);
  }, [clinics]);

  // Get clinic breakdown for a specific month
  const getClinicBreakdown = useCallback((year: number, month: number): { clinic: Clinic | null; sessions: number; value: number }[] => {
    const startDate = new Date(year, month, 1);
    const endDate = endOfMonth(startDate);
    
    const clinicTotals: Record<string, { sessions: number; value: number }> = {};
    let noClinicTotals = { sessions: 0, value: 0 };
    
    sessions.forEach(session => {
      const sessionDate = parseISO(session.date);
      if (isWithinInterval(sessionDate, { start: startDate, end: endDate })) {
        const totalValue = getSessionTotalValue(session);
        
        if (session.clinic_id) {
          if (!clinicTotals[session.clinic_id]) {
            clinicTotals[session.clinic_id] = { sessions: 0, value: 0 };
          }
          clinicTotals[session.clinic_id].sessions += session.count;
          clinicTotals[session.clinic_id].value += totalValue;
        } else {
          noClinicTotals.sessions += session.count;
          noClinicTotals.value += totalValue;
        }
      }
    });

    const result: { clinic: Clinic | null; sessions: number; value: number }[] = [];
    
    // Add clinic entries
    Object.entries(clinicTotals).forEach(([clinicId, data]) => {
      const clinic = clinics.find(c => c.id === clinicId);
      if (clinic) {
        result.push({ clinic, ...data });
      }
    });
    
    // Add "no clinic" entry if there are sessions without clinic
    if (noClinicTotals.sessions > 0) {
      result.push({ clinic: null, ...noClinicTotals });
    }
    
    // Sort by value descending
    result.sort((a, b) => b.value - a.value);
    
    return result;
  }, [sessions, clinics, getSessionTotalValue]);

  return {
    sessions,
    clinics,
    settings: {
      sessionValue: profile.session_value,
      weekStartsOn: profile.week_starts_on,
    },
    profile,
    isLoaded,
    addSession,
    deleteSession,
    updateSession,
    getSessionsForDate,
    getTotalForDate,
    getStats,
    getMonthlyHistory,
    getWeeklyHistory,
    getYearlyHistory,
    updateSettings,
    hasSessionsOnDate,
    hasShiftsOnDate,
    hasMixedOnDate,
    // Clinic functions
    addClinic,
    updateClinic,
    deleteClinic,
    getDefaultClinic,
    getClinicById,
    getClinicBreakdown,
  };
}
