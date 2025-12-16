import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Crown, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IndependentProfessionalHeaderProps {
  therapistName?: string | null;
}

export function IndependentProfessionalHeader({ therapistName }: IndependentProfessionalHeaderProps) {
  const today = new Date();
  const hour = today.getHours();
  const firstName = therapistName?.split(' ')[0];
  
  const getGreeting = () => {
    if (hour < 12) return { text: "Bom dia", emoji: "☀️" };
    if (hour < 18) return { text: "Boa tarde", emoji: "🌤️" };
    return { text: "Boa noite", emoji: "🌙" };
  };

  const greeting = getGreeting();

  return (
    <header className="relative px-5 pt-12 pb-8 overflow-hidden">
      {/* Background gradient - emerald for independence */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-primary/5 to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Star className="h-24 w-24 text-emerald-500" />
      </div>
      
      <div className="relative z-10">
        {/* Greeting */}
        <p className="text-2xl font-bold text-foreground mb-1">
          {greeting.text}, {firstName}! {greeting.emoji}
        </p>
        
        {/* Date */}
        <p className="text-sm text-muted-foreground font-medium mb-4">
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
        
        {/* Independence badge */}
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="text-sm text-muted-foreground">Você está no controle</span>
          <Badge 
            variant="secondary" 
            className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
          >
            <Crown className="h-3 w-3 mr-1" />
            Profissional Autônomo
          </Badge>
        </div>
      </div>
    </header>
  );
}
