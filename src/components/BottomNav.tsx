import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Calendar, History, Settings, Plus, Shield, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavProps {
  onAddClick?: () => void;
  isAdmin?: boolean;
  isManager?: boolean;
  canAddSessions?: boolean;
}

export function BottomNav({ onAddClick, isAdmin, isManager, canAddSessions = true }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Build nav items based on role
  const baseNavItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/calendar", icon: Calendar, label: "Calendário" },
    { path: "/history", icon: History, label: "Histórico" },
    { path: "/settings", icon: Settings, label: "Ajustes" },
  ];

  // For managers, replace some nav items
  const navItems = isManager && !isAdmin
    ? [
        { path: "/", icon: Home, label: "Início" },
        { path: "/manager", icon: Building, label: "Gestão" },
        { path: "/history", icon: History, label: "Histórico" },
        { path: "/settings", icon: Settings, label: "Ajustes" },
      ]
    : baseNavItems;

  // Show FAB only if user can add sessions
  const showFab = canAddSessions;

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
          
          {/* Center FAB or Admin/Manager Button */}
          <div className="relative -mt-8">
            {showFab ? (
              <Button
                variant="fab"
                size="fab"
                onClick={onAddClick}
                className="shadow-glow"
              >
                <Plus className="h-7 w-7" />
              </Button>
            ) : isManager ? (
              <Button
                variant="fab"
                size="fab"
                onClick={() => navigate('/manager')}
                className="shadow-glow bg-blue-600 hover:bg-blue-700"
              >
                <Building className="h-7 w-7" />
              </Button>
            ) : null}
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

      {/* Admin quick access - floating button */}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className={cn(
            "absolute top-0 right-4 -translate-y-full mb-2 p-2 rounded-full bg-destructive text-destructive-foreground shadow-lg transition-all",
            location.pathname === '/admin' && "ring-2 ring-destructive ring-offset-2 ring-offset-background"
          )}
        >
          <Shield className="h-5 w-5" />
        </button>
      )}
    </nav>
  );
}
