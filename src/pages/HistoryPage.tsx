import { useState } from "react";
import { format, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, CalendarDays, BarChart3 } from "lucide-react";
import { DayRecord } from "@/types/session";

interface HistoryPageProps {
  getMonthlyHistory: (year: number, month: number) => DayRecord[];
  getWeeklyHistory: (year: number, month: number) => { weekStart: Date; weekEnd: Date; sessions: number; value: number }[];
  getYearlyHistory: (year: number) => { month: number; sessions: number; value: number }[];
}

export function HistoryPage({
  getMonthlyHistory,
  getWeeklyHistory,
  getYearlyHistory,
}: HistoryPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("daily");

  const currentMonth = getMonth(currentDate);
  const currentYear = getYear(currentDate);

  const monthlyHistory = getMonthlyHistory(currentYear, currentMonth);
  const weeklyHistory = getWeeklyHistory(currentYear, currentMonth);
  const yearlyHistory = getYearlyHistory(currentYear);

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

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const totalMonthSessions = monthlyHistory.reduce((sum, day) => sum + day.sessions, 0);
  const totalMonthValue = monthlyHistory.reduce((sum, day) => sum + day.value, 0);

  return (
    <div className="min-h-screen gradient-surface pb-32">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe suas sessões ao longo do tempo
        </p>
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
                          {format(new Date(day.date), "EEE, d 'de' MMM", { locale: ptBR })}
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

          <TabsContent value="yearly" className="mt-0">
            <Card variant="elevated">
              <div className="space-y-3">
                {yearlyHistory.map((monthData) => {
                  const maxSessions = Math.max(...yearlyHistory.map(m => m.sessions), 1);
                  const barWidth = (monthData.sessions / maxSessions) * 100;
                  
                  return (
                    <div key={monthData.month} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {monthNames[monthData.month].substring(0, 3)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {monthData.sessions} • {formatCurrency(monthData.value)}
                        </p>
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
