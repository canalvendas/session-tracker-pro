import { useState, useEffect } from "react";
import { format, getMonth, getYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, CalendarDays, BarChart3, FileDown, ChevronRightIcon } from "lucide-react";
import { DayRecord } from "@/types/session";
import { Clinic } from "@/types/clinic";
import { generateMonthlyReport } from "@/lib/generateReport";
import { useToast } from "@/hooks/use-toast";

interface HistoryPageProps {
  getMonthlyHistory: (year: number, month: number) => DayRecord[];
  getWeeklyHistory: (year: number, month: number) => { weekStart: Date; weekEnd: Date; sessions: number; value: number }[];
  getYearlyHistory: (year: number) => { month: number; sessions: number; value: number }[];
  getClinicBreakdown: (year: number, month: number) => { clinic: Clinic | null; sessions: number; value: number }[];
  therapistName?: string;
  getLastSessionDate?: () => Date | null;
}

export function HistoryPage({
  getMonthlyHistory,
  getWeeklyHistory,
  getYearlyHistory,
  getClinicBreakdown,
  therapistName,
  getLastSessionDate,
}: HistoryPageProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize to the most recent month with sessions
  useEffect(() => {
    if (!hasInitialized && getLastSessionDate) {
      const lastDate = getLastSessionDate();
      if (lastDate) {
        setCurrentDate(lastDate);
      }
      setHasInitialized(true);
    }
  }, [getLastSessionDate, hasInitialized]);
  const [activeTab, setActiveTab] = useState("daily");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const currentMonth = getMonth(currentDate);
  const currentYear = getYear(currentDate);

  const monthlyHistory = getMonthlyHistory(currentYear, currentMonth);
  const weeklyHistory = getWeeklyHistory(currentYear, currentMonth);
  const yearlyHistory = getYearlyHistory(currentYear);
  const clinicBreakdown = getClinicBreakdown(currentYear, currentMonth);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleGenerateReport = () => {
    if (monthlyHistory.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há sessões registradas neste mês para gerar o relatório",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      generateMonthlyReport({
        monthlyHistory,
        weeklyHistory,
        clinicBreakdown,
        year: currentYear,
        month: currentMonth,
        therapistName,
      });
      
      toast({
        title: "Relatório gerado!",
        description: "O PDF foi baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const totalMonthSessions = monthlyHistory.reduce((sum, day) => sum + day.sessions, 0);
  const totalMonthValue = monthlyHistory.reduce((sum, day) => sum + day.value, 0);

  // Totais anuais
  const totalYearSessions = yearlyHistory.reduce((sum, month) => sum + month.sessions, 0);
  const totalYearValue = yearlyHistory.reduce((sum, month) => sum + month.value, 0);

  return (
    <div className="min-h-screen gradient-surface pb-32">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe suas sessões ao longo do tempo
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateReport}
            disabled={isGenerating || monthlyHistory.length === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            PDF
          </Button>
        </div>
      </header>

      <main className="px-5 space-y-5">
        {/* Month Navigator */}
        <Card variant="elevated" className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Card>

        {/* Month Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card variant="elevated" className="text-center">
            <p className="text-3xl font-bold text-foreground">{totalMonthSessions}</p>
            <p className="text-xs text-muted-foreground mt-1">sessões no mês</p>
          </Card>
          <Card variant="elevated" className="text-center">
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalMonthValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">faturamento</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="daily" className="text-xs">
              <CalendarDays className="h-4 w-4 mr-1.5" />
              Diário
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Semanal
            </TabsTrigger>
            <TabsTrigger value="yearly" className="text-xs">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Anual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-0">
            <Card variant="elevated">
              {monthlyHistory.length > 0 ? (
                <div className="space-y-3">
                  {monthlyHistory.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          {format(parseISO(day.date), "EEE, d 'de' MMM", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.sessions} {day.sessions === 1 ? 'sessão' : 'sessões'}
                        </p>
                      </div>
                      <p className="text-base font-semibold text-primary">
                        {formatCurrency(day.value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum registro neste mês
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="mt-0">
            <Card variant="elevated">
              {weeklyHistory.length > 0 ? (
                <div className="space-y-3">
                  {weeklyHistory.map((week, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {format(week.weekStart, "d MMM", { locale: ptBR })} - {format(week.weekEnd, "d MMM", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {week.sessions} {week.sessions === 1 ? 'sessão' : 'sessões'}
                        </p>
                      </div>
                      <p className="text-base font-semibold text-primary">
                        {formatCurrency(week.value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum registro neste mês
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="yearly" className="mt-0 space-y-4">
            {/* Resumo Anual */}
            <div className="grid grid-cols-2 gap-4">
              <Card variant="elevated" className="text-center">
                <p className="text-3xl font-bold text-foreground">{totalYearSessions}</p>
                <p className="text-xs text-muted-foreground mt-1">sessões em {currentYear}</p>
              </Card>
              <Card variant="elevated" className="text-center">
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalYearValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">faturamento anual</p>
              </Card>
            </div>

            <Card variant="elevated">
              <div className="space-y-3">
                {yearlyHistory.map((monthData) => {
                  const maxSessions = Math.max(...yearlyHistory.map(m => m.sessions), 1);
                  const barWidth = (monthData.sessions / maxSessions) * 100;
                  const hasData = monthData.sessions > 0;
                  
                  return (
                    <div 
                      key={monthData.month} 
                      className={`space-y-1 p-2 rounded-lg transition-colors ${hasData ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                      onClick={() => hasData && navigate(`/history/month/${currentYear}/${monthData.month}`)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {monthNames[monthData.month].substring(0, 3)}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {monthData.sessions} • {formatCurrency(monthData.value)}
                          </p>
                          {hasData && <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full gradient-primary rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
