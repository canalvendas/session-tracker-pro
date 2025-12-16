import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LinkedProfessionalHeaderProps {
  therapistName?: string | null;
  managerName?: string | null;
}

export function LinkedProfessionalHeader({ therapistName, managerName }: LinkedProfessionalHeaderProps) {
  const today = new Date();
  const hour = today.getHours();
  const firstName = therapistName?.split(' ')[0];
  
  const getGreeting = () => {
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <header className="relative px-5 pt-12 pb-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <Sparkles className="h-24 w-24 text-primary" />
      </div>
      
      <div className="relative z-10">
        {/* Greeting */}
        <p className="text-2xl font-bold text-foreground mb-1">
          {getGreeting()}, {firstName}! 👋
        </p>
        
        {/* Date */}
        <p className="text-sm text-muted-foreground font-medium mb-4">
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
        
        {/* Manager/Clinic badge */}
        {managerName && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-sm text-muted-foreground">Você faz parte da equipe</span>
            <Badge 
              variant="secondary" 
              className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors"
            >
              <Building2 className="h-3 w-3 mr-1" />
              {managerName}
            </Badge>
          </div>
        )}
      </div>
    </header>
  );
}
