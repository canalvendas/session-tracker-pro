import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionCalendar } from "@/components/SessionCalendar";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SessionRecord {
  id: string;
  date: string;
  count: number;
  created_at: string;
}

interface CalendarPageProps {
  hasSessionsOnDate: (date: Date) => boolean;
  getSessionsForDate: (date: Date) => SessionRecord[];
  getTotalForDate: (date: Date) => number;
  addSession: (date: Date, count: number) => void;
  deleteSession: (id: string) => void;
  sessionValue: number;
}

export function CalendarPage({
  hasSessionsOnDate,
  getSessionsForDate,
  getTotalForDate,
  addSession,
  deleteSession,
  sessionValue,
}: CalendarPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  const sessions = selectedDate ? getSessionsForDate(selectedDate) : [];
  const totalSessions = selectedDate ? getTotalForDate(selectedDate) : 0;
  const totalValue = totalSessions * sessionValue;

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
          />
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
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {session.count}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {session.count} {session.count === 1 ? 'sessão' : 'sessões'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(session.count * sessionValue)}
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
                ))}
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
