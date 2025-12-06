import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Calendar, History, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/calendar", icon: Calendar, label: "Calendário" },
  { path: "/history", icon: History, label: "Histórico" },
  { path: "/settings", icon: Settings, label: "Ajustes" },
];

interface BottomNavProps {
  onAddClick?: () => void;
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg safe-area-pb">
      <div className="mx-auto max-w-lg px-2">
        <div className="relative flex items-center justify-around py-2">
          {navItems.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-6 w-6 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className="mt-1 text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {/* Center FAB */}
          <div className="relative -mt-8">
            <Button
              variant="fab"
              size="fab"
              onClick={onAddClick}
              className="shadow-glow"
            >
              <Plus className="h-7 w-7" />
            </Button>
          </div>

          {navItems.slice(2).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-6 w-6 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className="mt-1 text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
