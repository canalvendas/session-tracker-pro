import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SessionCalendar } from "@/components/SessionCalendar";
import { Plus, Trash2, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Clinic } from "@/types/clinic";

interface SessionRecord {
  id: string;
  date: string;
  count: number;
  created_at: string;
  clinic_id: string | null;
  session_value: number | null;
  payment_type?: 'session' | 'shift' | null;
}

interface CalendarPageProps {
  hasSessionsOnDate: (date: Date) => boolean;
  hasShiftsOnDate: (date: Date) => boolean;
  hasMixedOnDate: (date: Date) => boolean;
  getSessionsForDate: (date: Date) => SessionRecord[];
  getTotalForDate: (date: Date) => number;
  addSession: (date: Date, count: number) => void;
  deleteSession: (id: string) => void;
  sessionValue: number;
  clinics: Clinic[];
  getClinicById: (id: string) => Clinic | undefined;
}

export function CalendarPage({
  hasSessionsOnDate,
  hasShiftsOnDate,
  hasMixedOnDate,
  getSessionsForDate,
  getTotalForDate,
  addSession,
  deleteSession,
  sessionValue,
  clinics,
  getClinicById,
}: CalendarPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const sessions = selectedDate ? getSessionsForDate(selectedDate) : [];
  const totalSessions = selectedDate ? getTotalForDate(selectedDate) : 0;
  
  // Calculate total value based on individual session values and payment types
  const totalValue = sessions.reduce((sum, session) => {
    const value = session.session_value ?? sessionValue;
    // For shifts, the stored value IS the total; for sessions, multiply
    if (session.payment_type === 'shift') {
      return sum + value;
    }
    return sum + (session.count * value);
  }, 0);

  // Get clinic info for a session
  const getSessionClinic = (session: SessionRecord): Clinic | undefined => {
    if (!session.clinic_id) return undefined;
    return getClinicById(session.clinic_id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleAddSession = () => {
    if (selectedDate) {
      addSession(selectedDate, 1);
      toast({
        title: "Sessão adicionada!",
        description: `1 sessão registrada para ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}`,
      });
    }
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    toast({
      title: "Sessão removida",
      description: "O registro foi excluído com sucesso",
    });
  };

  return (
    <div className="min-h-screen gradient-surface pb-32">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione uma data para ver ou adicionar sessões
        </p>
      </header>

      <main className="px-5 space-y-5">
        {/* Calendar Card */}
        <Card variant="elevated" className="p-3">
          <SessionCalendar
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            hasSessionsOnDate={hasSessionsOnDate}
            hasShiftsOnDate={hasShiftsOnDate}
            hasMixedOnDate={hasMixedOnDate}
          />
          
          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Legenda:</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Sessões</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Turnos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="h-2 w-2 rounded-full bg-blue-500 -ml-1" />
                <span className="text-muted-foreground">Ambos</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Selected Date Info */}
        {selectedDate && (
          <Card variant="elevated" className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground capitalize">
                  {format(selectedDate, "EEEE", { locale: ptBR })}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <Button variant="default" size="sm" onClick={handleAddSession}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {/* Day Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-xl mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
                <p className="text-xs text-muted-foreground">
                  {totalSessions === 1 ? 'sessão' : 'sessões'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground">valor total</p>
              </div>
            </div>

            {/* Session List */}
            {sessions.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Registros do dia
                </h3>
                {sessions.map((session) => {
                  const clinic = getSessionClinic(session);
                  const sessionVal = session.session_value ?? sessionValue;
                  
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: clinic ? `${clinic.color}20` : 'hsl(var(--primary) / 0.1)',
                          }}
                        >
                          <span 
                            className="text-sm font-semibold"
                            style={{ color: clinic?.color || 'hsl(var(--primary))' }}
                          >
                            {session.count}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">
                              {session.payment_type === 'shift' 
                                ? `${session.count} ${session.count === 1 ? 'turno' : 'turnos'}`
                                : `${session.count} ${session.count === 1 ? 'sessão' : 'sessões'}`
                              }
                            </p>
                            {/* Payment type badge */}
                            {session.payment_type === 'shift' ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0">
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                Turno
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                                <Users className="h-2.5 w-2.5 mr-0.5" />
                                Sessão
                              </Badge>
                            )}
                            {clinic && (
                              <span 
                                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                                style={{ 
                                  backgroundColor: `${clinic.color}20`,
                                  color: clinic.color 
                                }}
                              >
                                <span 
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: clinic.color }}
                                />
                                {clinic.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(session.payment_type === 'shift' ? sessionVal : session.count * sessionVal)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">
                  Nenhuma sessão registrada neste dia
                </p>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
