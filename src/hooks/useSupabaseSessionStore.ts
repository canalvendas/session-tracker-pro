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
  startOfYear,
  endOfYear
} from 'date-fns';

interface Session {
  id: string;
  date: string;
  count: number;
  created_at: string;
}

interface Profile {
  session_value: number;
  week_starts_on: 0 | 1;
  full_name: string | null;
  is_paid: boolean;
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
  const [profile, setProfile] = useState<Profile>({
    session_value: 40,
    week_starts_on: 1,
    full_name: null,
    is_paid: false,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch sessions and profile
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setIsLoaded(true);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (sessionsError) throw sessionsError;
        setSessions(sessionsData || []);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('session_value, week_starts_on, full_name, is_paid')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData) {
          setProfile({
            session_value: Number(profileData.session_value),
            week_starts_on: profileData.week_starts_on as 0 | 1,
            full_name: profileData.full_name,
            is_paid: profileData.is_paid ?? false,
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

  const addSession = useCallback(async (date: Date, count: number = 1) => {
    if (!user) return null;

    const dateStr = format(date, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        date: dateStr,
        count,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding session:', error);
      return null;
    }

    setSessions(prev => [data, ...prev]);
    return data;
  }, [user]);

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

  const updateSession = useCallback(async (id: string, count: number) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sessions')
      .update({ count })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return;
    }

    setSessions(prev => prev.map(s => s.id === id ? data : s));
  }, [user]);

  const getSessionsForDate = useCallback((date: Date): Session[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr);
  }, [sessions]);

  const getTotalForDate = useCallback((date: Date): number => {
    return getSessionsForDate(date).reduce((sum, s) => sum + s.count, 0);
  }, [getSessionsForDate]);

  const getStats = useCallback((referenceDate: Date = new Date()): Stats => {
    const today = format(referenceDate, 'yyyy-MM-dd');
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: profile.week_starts_on });
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: profile.week_starts_on });
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);

    let dailySessions = 0;
    let weeklySessions = 0;
    let monthlySessions = 0;

    sessions.forEach(session => {
      const sessionDate = parseISO(session.date);
      
      if (session.date === today) {
        dailySessions += session.count;
      }
      
      if (isWithinInterval(sessionDate, { start: weekStart, end: weekEnd })) {
        weeklySessions += session.count;
      }
      
      if (isWithinInterval(sessionDate, { start: monthStart, end: monthEnd })) {
        monthlySessions += session.count;
      }
    });

    return {
      daily: {
        sessions: dailySessions,
        value: dailySessions * profile.session_value,
      },
      weekly: {
        sessions: weeklySessions,
        value: weeklySessions * profile.session_value,
      },
      monthly: {
        sessions: monthlySessions,
        value: monthlySessions * profile.session_value,
      },
    };
  }, [sessions, profile]);

  const getMonthlyHistory = useCallback((year: number, month: number): DayRecord[] => {
    const startDate = new Date(year, month, 1);
    const endDate = endOfMonth(startDate);
    
    const dailyTotals: Record<string, number> = {};
    
    sessions.forEach(session => {
      const sessionDate = parseISO(session.date);
      if (isWithinInterval(sessionDate, { start: startDate, end: endDate })) {
        dailyTotals[session.date] = (dailyTotals[session.date] || 0) + session.count;
      }
    });

    return Object.entries(dailyTotals)
      .map(([date, sessionCount]) => ({
        date,
        sessions: sessionCount,
        value: sessionCount * profile.session_value,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, profile]);

  const getWeeklyHistory = useCallback((year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = endOfMonth(monthStart);
    
    const weeks: { weekStart: Date; weekEnd: Date; sessions: number; value: number }[] = [];
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: profile.week_starts_on });
    
    while (currentWeekStart <= monthEnd) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: profile.week_starts_on });
      let weekSessions = 0;
      
      sessions.forEach(session => {
        const sessionDate = parseISO(session.date);
        if (isWithinInterval(sessionDate, { start: currentWeekStart, end: currentWeekEnd })) {
          weekSessions += session.count;
        }
      });
      
      if (weekSessions > 0) {
        weeks.push({
          weekStart: currentWeekStart,
          weekEnd: currentWeekEnd,
          sessions: weekSessions,
          value: weekSessions * profile.session_value,
        });
      }
      
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  }, [sessions, profile]);

  const getYearlyHistory = useCallback((year: number) => {
    const monthlyTotals: { month: number; sessions: number; value: number }[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = endOfMonth(monthStart);
      let monthSessions = 0;
      
      sessions.forEach(session => {
        const sessionDate = parseISO(session.date);
        if (isWithinInterval(sessionDate, { start: monthStart, end: monthEnd })) {
          monthSessions += session.count;
        }
      });
      
      monthlyTotals.push({
        month,
        sessions: monthSessions,
        value: monthSessions * profile.session_value,
      });
    }
    
    return monthlyTotals;
  }, [sessions, profile]);

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

  return {
    sessions,
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
  };
}
