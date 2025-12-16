import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Calendar, TrendingUp, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Session {
  id: string;
  date: string;
  count: number;
  session_value: number | null;
  clinic_id: string | null;
  created_at: string;
  clinics: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface Professional {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
}

export function ManagerProfessionalDetail() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchProfessionalData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch professional info
      const profResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=professionals`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (profResponse.ok) {
        const profResult = await profResponse.json();
        const prof = profResult.professionals?.find((p: Professional) => p.user_id === userId);
        if (prof) {
          setProfessional(prof);
        }
      }

      // Fetch sessions
      const sessionsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=sessions&userId=${userId}&month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!sessionsResponse.ok) {
        const errorData = await sessionsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch sessions');
      }

      const sessionsResult = await sessionsResponse.json();
      setSessions(sessionsResult.sessions || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.message?.includes('Forbidden') || error.message?.includes('not linked')) {
        toast({
          title: "Acesso negado",
          description: "Você não tem acesso a este profissional.",
          variant: "destructive",
        });
        navigate('/manager');
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionalData();
  }, [userId, selectedMonth, selectedYear]);

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalSessions = sessions.reduce((sum, s) => sum + s.count, 0);
  const totalValue = sessions.reduce((sum, s) => sum + (s.count * (s.session_value || 0)), 0);

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = [];
    }
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const sortedDates = Object.keys(sessionsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-screen gradient-surface pb-24">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/manager')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {professional?.full_name || 'Profissional'}
                </h1>
                <p className="text-sm text-muted-foreground">{professional?.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProfessionalData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{totalSessions}</p>
                    <p className="text-sm text-muted-foreground">Sessões</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sessions List */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Histórico de Sessões
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sortedDates.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma sessão neste período.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {sortedDates.map((date) => {
                      const daySessions = sessionsByDate[date];
                      const dayTotal = daySessions.reduce((sum, s) => sum + s.count, 0);
                      const dayValue = daySessions.reduce((sum, s) => 
                        sum + (s.count * (s.session_value || 0)), 0
                      );
                      
                      // Group by clinic within the same day
                      const sessionsByClinic = daySessions.reduce((acc, session) => {
                        const clinicKey = session.clinics?.id || 'no-clinic';
                        if (!acc[clinicKey]) {
                          acc[clinicKey] = {
                            clinic: session.clinics,
                            sessions: [],
                            totalCount: 0,
                            totalValue: 0
                          };
                        }
                        acc[clinicKey].sessions.push(session);
                        acc[clinicKey].totalCount += session.count;
                        acc[clinicKey].totalValue += session.count * (session.session_value || 0);
                        return acc;
                      }, {} as Record<string, { clinic: Session['clinics']; sessions: Session[]; totalCount: number; totalValue: number }>);

                      const clinicGroups = Object.values(sessionsByClinic);
                      const hasMultipleClinics = clinicGroups.length > 1;
                      
                      return (
                        <div key={date} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-foreground">
                              {format(new Date(date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </p>
                            <span className="font-semibold text-primary">
                              {formatCurrency(dayValue)}
                            </span>
                          </div>
                          
                          {clinicGroups.map((group, idx) => (
                            <div 
                              key={group.clinic?.id || `no-clinic-${idx}`} 
                              className={`flex items-center justify-between text-sm ${hasMultipleClinics ? 'ml-4 py-1' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                {group.clinic && (
                                  <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: group.clinic.color }}
                                  />
                                )}
                                <span className="text-muted-foreground">
                                  {group.totalCount} {group.totalCount === 1 ? 'sessão' : 'sessões'}
                                  {group.clinic && (
                                    <span className="ml-1">• {group.clinic.name}</span>
                                  )}
                                </span>
                              </div>
                              {hasMultipleClinics && (
                                <span className="text-muted-foreground">
                                  {formatCurrency(group.totalValue)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
