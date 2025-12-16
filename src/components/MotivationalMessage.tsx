import { Sparkles, Zap, Trophy, Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MotivationalMessageProps {
  dailySessions: number;
  weeklyValue: number;
}

export function MotivationalMessage({ dailySessions, weeklyValue }: MotivationalMessageProps) {
  const getMotivation = () => {
    if (dailySessions === 0) {
      return {
        icon: Zap,
        title: "Comece seu dia com energia!",
        subtitle: "Registre sua primeira sessão",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
    }
    if (dailySessions <= 2) {
      return {
        icon: Star,
        title: "Ótimo começo!",
        subtitle: "Continue assim, você está no caminho certo",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      };
    }
    if (dailySessions <= 4) {
      return {
        icon: Sparkles,
        title: "Você está arrasando! 🔥",
        subtitle: `Já são ${dailySessions} sessões hoje`,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
      };
    }
    if (dailySessions <= 6) {
      return {
        icon: Trophy,
        title: "Dia super produtivo!",
        subtitle: "Você está fazendo a diferença",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    }
    return {
      icon: Heart,
      title: "Incrível! Você é inspiração! 🎉",
      subtitle: `${dailySessions} sessões - Dia excepcional!`,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    };
  };

  const motivation = getMotivation();
  const Icon = motivation.icon;

  return (
    <Card 
      variant="glass" 
      className={`${motivation.border} ${motivation.bg} animate-fade-in`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${motivation.bg}`}>
          <Icon className={`h-6 w-6 ${motivation.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground">
            {motivation.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {motivation.subtitle}
          </p>
        </div>
      </div>
    </Card>
  );
}
