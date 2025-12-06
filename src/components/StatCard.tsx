import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  sessions: number;
  value: number;
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "accent";
  className?: string;
}

export function StatCard({ 
  title, 
  sessions, 
  value, 
  icon: Icon, 
  variant = "secondary",
  className 
}: StatCardProps) {
  const variants = {
    primary: "gradient-primary text-primary-foreground",
    secondary: "bg-card border border-border",
    accent: "gradient-accent text-accent-foreground",
  };

  const textVariants = {
    primary: "text-primary-foreground/80",
    secondary: "text-muted-foreground",
    accent: "text-accent-foreground/80",
  };

  const valueVariants = {
    primary: "text-primary-foreground",
    secondary: "text-foreground",
    accent: "text-accent-foreground",
  };

  const iconBgVariants = {
    primary: "bg-primary-foreground/20",
    secondary: "bg-primary/10",
    accent: "bg-accent-foreground/20",
  };

  const iconColorVariants = {
    primary: "text-primary-foreground",
    secondary: "text-primary",
    accent: "text-accent-foreground",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <Card 
      variant="elevated"
      className={cn(
        "relative overflow-hidden transition-transform duration-200 hover:scale-[1.02]",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn("text-xs font-medium uppercase tracking-wider mb-2", textVariants[variant])}>
            {title}
          </p>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className={cn("text-3xl font-bold tabular-nums", valueVariants[variant])}>
                {sessions}
              </span>
              <span className={cn("text-sm font-medium", textVariants[variant])}>
                {sessions === 1 ? 'sessão' : 'sessões'}
              </span>
            </div>
            <p className={cn("text-lg font-semibold", valueVariants[variant])}>
              {formatCurrency(value)}
            </p>
          </div>
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          iconBgVariants[variant]
        )}>
          <Icon className={cn("h-6 w-6", iconColorVariants[variant])} />
        </div>
      </div>
    </Card>
  );
}
