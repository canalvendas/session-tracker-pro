import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export type UnitType = 'sessions' | 'shifts' | 'mixed';

interface PremiumStatCardProps {
  title: string;
  sessions: number;
  shifts?: number;
  value: number;
  icon: LucideIcon;
  variant?: "primary" | "blue" | "emerald";
  size?: "large" | "small";
  unitType?: UnitType;
}

export function PremiumStatCard({ 
  title, 
  sessions, 
  shifts = 0,
  value, 
  icon: Icon, 
  variant = "primary",
  size = "small",
  unitType = "sessions"
}: PremiumStatCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getUnitLabel = () => {
    if (unitType === 'shifts') {
      return `${shifts} ${shifts === 1 ? 'turno' : 'turnos'}`;
    }
    if (unitType === 'mixed') {
      const parts = [];
      if (sessions > 0) parts.push(`${sessions} ${sessions === 1 ? 'sessão' : 'sessões'}`);
      if (shifts > 0) parts.push(`${shifts} ${shifts === 1 ? 'turno' : 'turnos'}`);
      return parts.length > 0 ? parts.join(' • ') : '0 sessões';
    }
    return `${sessions} ${sessions === 1 ? 'sessão' : 'sessões'}`;
  };

  const gradients = {
    primary: "from-primary/20 via-primary/10 to-transparent",
    blue: "from-blue-500/20 via-blue-500/10 to-transparent",
    emerald: "from-emerald-500/20 via-emerald-500/10 to-transparent",
  };

  const iconBg = {
    primary: "bg-primary/20",
    blue: "bg-blue-500/20",
    emerald: "bg-emerald-500/20",
  };

  const iconColor = {
    primary: "text-primary",
    blue: "text-blue-500",
    emerald: "text-emerald-500",
  };

  const valueColor = {
    primary: "text-primary",
    blue: "text-blue-500",
    emerald: "text-emerald-500",
  };

  if (size === "large") {
    return (
      <Card 
        variant="elevated" 
        className="relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradients[variant]}`} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </span>
            <div className={`p-2 rounded-lg ${iconBg[variant]}`}>
              <Icon className={`h-5 w-5 ${iconColor[variant]}`} />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className={`text-3xl font-bold ${valueColor[variant]}`}>
              {formatCurrency(value)}
            </p>
            <p className="text-sm text-muted-foreground">
              {getUnitLabel()}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      variant="elevated" 
      className="relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[variant]}`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-1.5 rounded-lg ${iconBg[variant]}`}>
            <Icon className={`h-4 w-4 ${iconColor[variant]}`} />
          </div>
        </div>
        
        <p className={`text-xl font-bold ${valueColor[variant]} mb-0.5`}>
          {formatCurrency(value)}
        </p>
        <p className="text-xs text-muted-foreground">
          {getUnitLabel()}
        </p>
      </div>
    </Card>
  );
}