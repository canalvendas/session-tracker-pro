import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Users, TrendingUp, DollarSign, Calendar, ChevronRight, User } from "lucide-react";
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

interface ProfessionalSummary {
  professional_id: string;
  user_id: string;
  full_name: string | null;
  total_sessions: number;
  total_value: number;
}

interface SummaryData {
  summaries: ProfessionalSummary[];
  total_professionals: number;
  grand_total_sessions: number;
  grand_total_value: number;
}

export function ManagerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=summary&month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch summary');
      }

      const result = await response.json();
      setSummaryData(result);
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      if (error.message?.includes('Forbidden')) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão de gestor.",
          variant: "destructive",
        });
        navigate('/');
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
    fetchSummary();
  }, [selectedMonth, selectedYear]);

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

  return (
    <div className="min-h-screen gradient-surface pb-24">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Painel do Gestor</h1>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSummary} disabled={loading}>
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
        ) : summaryData ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{summaryData.total_professionals}</p>
                    <p className="text-sm text-muted-foreground">Profissionais</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">{summaryData.grand_total_sessions}</p>
                    <p className="text-sm text-muted-foreground">Total Sessões</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryData.grand_total_value)}</p>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Professionals List */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Profissionais - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {summaryData.summaries.length === 0 ? (
                  <div className="p-8 text-center">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum profissional vinculado.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {summaryData.summaries.map((prof) => (
                      <button
                        key={prof.user_id}
                        onClick={() => navigate(`/manager/professional/${prof.user_id}`)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">
                              {prof.full_name || 'Sem nome'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {prof.total_sessions} sessões
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-primary">
                            {formatCurrency(prof.total_value)}
                          </span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Não foi possível carregar os dados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
