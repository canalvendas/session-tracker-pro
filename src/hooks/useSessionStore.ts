import { useState, useEffect, useCallback } from 'react';
import { Session, Settings, Stats, DayRecord } from '@/types/session';
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
import { ptBR } from 'date-fns/locale';

const STORAGE_KEYS = {
  SESSIONS: 'therapy-sessions',
  SETTINGS: 'therapy-settings',
};

const DEFAULT_SETTINGS: Settings = {
  sessionValue: 40,
  weekStartsOn: 1,
};

export function useSessionStore() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    if (storedSessions) {
      setSessions(JSON.parse(storedSessions));
    }
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }
  }, [sessions, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const addSession = useCallback(async (date: Date, count: number = 1): Promise<Session> => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const newSession: Session = {
      id: crypto.randomUUID(),
      date: dateStr,
      count,
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [...prev, newSession]);
    return newSession;
  }, []);

  const updateSession = useCallback((id: string, count: number) => {
    setSessions(prev => 
      prev.map(s => s.id === id ? { ...s, count } : s)
    );
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const getSessionsForDate = useCallback((date: Date): Session[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr);
  }, [sessions]);

  const getTotalForDate = useCallback((date: Date): number => {
    return getSessionsForDate(date).reduce((sum, s) => sum + s.count, 0);
  }, [getSessionsForDate]);

  const getStats = useCallback((referenceDate: Date = new Date()): Stats => {
    const today = format(referenceDate, 'yyyy-MM-dd');
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: settings.weekStartsOn });
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: settings.weekStartsOn });
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
        value: dailySessions * settings.sessionValue,
      },
      weekly: {
        sessions: weeklySessions,
        value: weeklySessions * settings.sessionValue,
      },
      monthly: {
        sessions: monthlySessions,
        value: monthlySessions * settings.sessionValue,
      },
    };
  }, [sessions, settings]);

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
        value: sessionCount * settings.sessionValue,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, settings]);

  const getWeeklyHistory = useCallback((year: number, month: number) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = endOfMonth(monthStart);
    
    const weeks: { weekStart: Date; weekEnd: Date; sessions: number; value: number }[] = [];
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: settings.weekStartsOn });
    
    while (currentWeekStart <= monthEnd) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: settings.weekStartsOn });
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
          value: weekSessions * settings.sessionValue,
        });
      }
      
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  }, [sessions, settings]);

  const getYearlyHistory = useCallback((year: number) => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    
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
        value: monthSessions * settings.sessionValue,
      });
    }
    
    return monthlyTotals;
  }, [sessions, settings]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const hasSessionsOnDate = useCallback((date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.some(s => s.date === dateStr);
  }, [sessions]);

  return {
    sessions,
    settings,
    isLoaded,
    addSession,
    updateSession,
    deleteSession,
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
