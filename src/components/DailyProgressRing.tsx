import { Target, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DailyProgressRingProps {
  currentSessions: number;
  goalSessions?: number;
}

export function DailyProgressRing({ currentSessions, goalSessions = 5 }: DailyProgressRingProps) {
  const progress = Math.min((currentSessions / goalSessions) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const remaining = Math.max(goalSessions - currentSessions, 0);
  const isCompleted = currentSessions >= goalSessions;

  const getMessage = () => {
    if (isCompleted) return "Meta alcançada! 🎉";
    if (remaining === 1) return "Falta apenas 1 sessão!";
    return `Faltam ${remaining} para sua meta!`;
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
                <span className="text-2xl font-bold text-foreground">{currentSessions}</span>
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
            {currentSessions} de {goalSessions} sessões
          </p>
          <p className={`text-sm font-medium ${isCompleted ? "text-emerald-500" : "text-muted-foreground"}`}>
            {getMessage()}
          </p>
        </div>
      </div>
    </Card>
  );
}
