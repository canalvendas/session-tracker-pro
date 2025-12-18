import { Target, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { UnitType } from "./PremiumStatCard";

interface DailyProgressRingProps {
  currentSessions: number;
  currentShifts?: number;
  goalSessions?: number;
  unitType?: UnitType;
}

export function DailyProgressRing({ 
  currentSessions, 
  currentShifts = 0,
  goalSessions = 5,
  unitType = "sessions"
}: DailyProgressRingProps) {
  // Calculate total based on unit type
  const currentTotal = unitType === 'shifts' ? currentShifts : 
                       unitType === 'mixed' ? currentSessions + currentShifts : 
                       currentSessions;
  
  const progress = Math.min((currentTotal / goalSessions) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const remaining = Math.max(goalSessions - currentTotal, 0);
  const isCompleted = currentTotal >= goalSessions;

  const getUnitWord = (count: number, singular: string, plural: string) => {
    return count === 1 ? singular : plural;
  };

  const getMessage = () => {
    if (isCompleted) return "Meta alcançada! 🎉";
    
    if (unitType === 'shifts') {
      if (remaining === 1) return "Falta apenas 1 turno!";
      return `Faltam ${remaining} para sua meta!`;
    }
    
    if (unitType === 'mixed') {
      if (remaining === 1) return "Falta apenas 1!";
      return `Faltam ${remaining} para sua meta!`;
    }
    
    if (remaining === 1) return "Falta apenas 1 sessão!";
    return `Faltam ${remaining} para sua meta!`;
  };

  const getProgressLabel = () => {
    if (unitType === 'shifts') {
      return `${currentShifts} de ${goalSessions} ${getUnitWord(goalSessions, 'turno', 'turnos')}`;
    }
    if (unitType === 'mixed') {
      const parts = [];
      if (currentSessions > 0) parts.push(`${currentSessions} ${getUnitWord(currentSessions, 'sessão', 'sessões')}`);
      if (currentShifts > 0) parts.push(`${currentShifts} ${getUnitWord(currentShifts, 'turno', 'turnos')}`);
      const currentLabel = parts.length > 0 ? parts.join(' + ') : '0';
      return `${currentLabel} de ${goalSessions}`;
    }
    return `${currentSessions} de ${goalSessions} ${getUnitWord(goalSessions, 'sessão', 'sessões')}`;
  };

  return (
    <Card variant="elevated" className="relative overflow-hidden">
      {/* Background gradient when completed */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-emerald-500/10" />
      )}
      
      <div className="relative z-10 flex items-center gap-6">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90 transform">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-secondary"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${
                isCompleted ? "text-emerald-500" : "text-primary"
              }`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isCompleted ? (
              <Flame className="h-8 w-8 text-emerald-500 animate-pulse" />
            ) : (
              <div className="text-center">
                <span className="text-2xl font-bold text-foreground">{currentTotal}</span>
                <span className="text-xs text-muted-foreground">/{goalSessions}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Meta Diária
            </span>
          </div>
          <p className="text-lg font-bold text-foreground mb-1">
            {getProgressLabel()}
          </p>
          <p className={`text-sm font-medium ${isCompleted ? "text-emerald-500" : "text-muted-foreground"}`}>
            {getMessage()}
          </p>
        </div>
      </div>
    </Card>
  );
}