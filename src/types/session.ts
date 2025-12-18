export interface Session {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  count: number;
  createdAt: string;
}

export interface DayRecord {
  date: string;
  sessions: number;
  value: number;
}

export interface Settings {
  sessionValue: number;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
}

export interface Stats {
  daily: {
    sessions: number;
    shifts: number;
    value: number;
  };
  weekly: {
    sessions: number;
    shifts: number;
    value: number;
  };
  monthly: {
    sessions: number;
    shifts: number;
    value: number;
  };
}
