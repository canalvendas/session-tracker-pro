import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown, ChevronRight, Pencil, Trash2, CalendarDays, Sun, Moon, SunMoon, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DayRecord } from "@/types/session";
import { Clinic, ShiftPeriod } from "@/types/clinic";
import { Badge } from "@/components/ui/badge";

interface Session {
  id: string;
  date: string;
  count: number;
  created_at: string;
  clinic_id: string | null;
  session_value: number | null;
  payment_type?: 'session' | 'shift' | null;
  shift_period?: ShiftPeriod | null;
}

interface MonthDetailPageProps {
  getMonthlyHistory: (year: number, month: number) => DayRecord[];
  getSessionsForDate: (date: Date) => Session[];
  deleteSession: (id: string) => Promise<void>;
  updateSession: (id: string, count: number) => Promise<void>;
  sessionValue: number;
  clinics: Clinic[];
  getClinicById: (id: string) => Clinic | undefined;
}

export function MonthDetailPage({
  getMonthlyHistory,
  getSessionsForDate,
  deleteSession,
  updateSession,
  sessionValue,
  clinics,
  getClinicById,
}: MonthDetailPageProps) {
  const navigate = useNavigate();
  const { year, month } = useParams<{ year: string; month: string }>();
  const { toast } = useToast();
  
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [editCount, setEditCount] = useState(1);

  const yearNum = parseInt(year || "2025", 10);
  const monthNum = parseInt(month || "0", 10);

  const monthlyHistory = getMonthlyHistory(yearNum, monthNum);
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getShiftPeriodLabel = (period: ShiftPeriod | null | undefined): string => {
    switch (period) {
      case 'morning': return 'Manhã';
      case 'afternoon': return 'Tarde';
      case 'full_day': return 'Dia inteiro';
      default: return 'Turno';
    }
  };

  const getShiftPeriodIcon = (period: ShiftPeriod | null | undefined) => {
    switch (period) {
      case 'morning': return <Sun className="h-3 w-3" />;
      case 'afternoon': return <Moon className="h-3 w-3" />;
      case 'full_day': return <SunMoon className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const totalMonthSessions = monthlyHistory.reduce((sum, day) => sum + day.sessions, 0);
  const totalMonthValue = monthlyHistory.reduce((sum, day) => sum + day.value, 0);

  const toggleDay = (dateStr: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateStr)) {
      newExpanded.delete(dateStr);
    } else {
      newExpanded.add(dateStr);
    }
    setExpandedDays(newExpanded);
  };

  const handleDeleteClick = (session: Session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      await deleteSession(sessionToDelete.id);
      toast({
        title: "Sessão excluída",
        description: "A sessão foi removida com sucesso",
      });
    }
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const handleEditClick = (session: Session) => {
    setSessionToEdit(session);
    setEditCount(session.count);
    setEditSheetOpen(true);
  };

  const confirmEdit = async () => {
    if (sessionToEdit && editCount > 0) {
      await updateSession(sessionToEdit.id, editCount);
      toast({
        title: "Sessão atualizada",
        description: "A quantidade foi alterada com sucesso",
      });
    }
    setEditSheetOpen(false);
    setSessionToEdit(null);
  };

  return (
    <div className="min-h-screen gradient-surface pb-32">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/history')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {monthNames[monthNum]} {yearNum}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Detalhes das sessões do mês
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Month Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card variant="elevated" className="text-center">
            <p className="text-3xl font-bold text-foreground">{totalMonthSessions}</p>
            <p className="text-xs text-muted-foreground mt-1">sessões</p>
          </Card>
          <Card variant="elevated" className="text-center">
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalMonthValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">faturamento</p>
          </Card>
        </div>

        {/* Days List */}
        <Card variant="elevated">
          {monthlyHistory.length > 0 ? (
            <div className="space-y-2">
              {monthlyHistory.map((day) => {
                const isExpanded = expandedDays.has(day.date);
                const sessionsForDay = getSessionsForDate(parseISO(day.date));

                return (
                  <Collapsible key={day.date} open={isExpanded} onOpenChange={() => toggleDay(day.date)}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-foreground capitalize">
                              {format(parseISO(day.date), "EEE, d 'de' MMM", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {day.sessions} {day.sessions === 1 ? 'sessão' : 'sessões'}
                            </p>
                          </div>
                        </div>
                        <p className="text-base font-semibold text-primary">
                          {formatCurrency(day.value)}
                        </p>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-7 mt-2 space-y-2">
                        {sessionsForDay.map((session, index) => {
                          const clinic = session.clinic_id ? getClinicById(session.clinic_id) : undefined;
                          const sessionVal = session.session_value ?? sessionValue;
                          const isShift = session.payment_type === 'shift';
                          const displayValue = isShift ? sessionVal : session.count * sessionVal;
                          
                          return (
                            <div
                              key={session.id}
                              className="flex items-center justify-between p-3 bg-background border border-border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {clinic && (
                                  <div 
                                    className="h-2 w-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: clinic.color }}
                                  />
                                )}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium text-foreground">
                                      {isShift 
                                        ? getShiftPeriodLabel(session.shift_period)
                                        : `${session.count} ${session.count === 1 ? 'sessão' : 'sessões'}`
                                      }
                                    </p>
                                    {/* Payment type badge */}
                                    {isShift ? (
                                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] px-1.5 py-0">
                                        {getShiftPeriodIcon(session.shift_period)}
                                        <span className="ml-0.5">{session.shift_period === 'full_day' ? 'Integral' : 'Turno'}</span>
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                                        <Users className="h-2.5 w-2.5 mr-0.5" />
                                        Sessão
                                      </Badge>
                                    )}
                                    {clinic && (
                                      <span 
                                        className="text-xs px-1.5 py-0.5 rounded"
                                        style={{ 
                                          backgroundColor: `${clinic.color}20`,
                                          color: clinic.color 
                                        }}
                                      >
                                        {clinic.name}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {formatCurrency(displayValue)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(session);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(session);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhuma sessão registrada neste mês
              </p>
            </div>
          )}
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A sessão será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Session Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Editar Sessão</SheetTitle>
            <SheetDescription>
              Altere a quantidade de sessões deste registro
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <Label htmlFor="sessionCount">Quantidade de sessões</Label>
            <Input
              id="sessionCount"
              type="number"
              min={1}
              value={editCount}
              onChange={(e) => setEditCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-2"
            />
          </div>
          <SheetFooter>
            <Button onClick={confirmEdit} className="w-full">
              Salvar alterações
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}