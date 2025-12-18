import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  RefreshCw, Users, TrendingUp, DollarSign, ChevronRight, User, 
  UserPlus, FileText, CreditCard, BarChart3, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { RegisterProfessionalSheet } from "@/components/RegisterProfessionalSheet";

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
  const [managerName, setManagerName] = useState<string | null>(null);
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const fetchManagerInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setManagerName(profile.full_name);
        }
      }
    } catch (error) {
      console.error('Error fetching manager info:', error);
    }
  };

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
    fetchManagerInfo();
  }, []);

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


  const averageSessionsPerProfessional = summaryData && summaryData.total_professionals > 0
    ? Math.round(summaryData.grand_total_sessions / summaryData.total_professionals)
    : 0;

  const firstName = managerName?.split(' ')[0];

  // Skeleton loading component
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="h-24 bg-muted/50 rounded-xl"></div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-surface pb-32">
      {/* Hero Section */}
      <header className="px-5 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-semibold text-foreground mb-1">
              {getGreeting()}{firstName ? `, ${firstName}` : ''}! 👋
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchSummary} 
            disabled={loading}
            className="rounded-full"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Period Filter - Elegant Pills */}
        <div className="flex items-center gap-2 mt-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[130px] h-9 rounded-full bg-secondary/50 border-0">
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
            <SelectTrigger className="w-[90px] h-9 rounded-full bg-secondary/50 border-0">
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
      </header>

      <main className="px-5 space-y-6">
        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : summaryData ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {/* Profissionais */}
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{summaryData.total_professionals}</p>
                  <p className="text-xs text-muted-foreground mt-1">Profissionais ativos</p>
                </CardContent>
              </Card>

              {/* Sessões */}
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-full bg-blue-500/20">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{summaryData.grand_total_sessions}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sessões no mês</p>
                </CardContent>
              </Card>

              {/* Faturamento */}
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-full bg-emerald-500/20">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryData.grand_total_value)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Faturamento total</p>
                </CardContent>
              </Card>

              {/* Média */}
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-full bg-purple-500/20">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{averageSessionsPerProfessional}</p>
                  <p className="text-xs text-muted-foreground mt-1">Média sessões/prof.</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Ações Rápidas
              </h2>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 bg-card/50 border-border/50 hover:bg-primary/10 hover:border-primary/30"
                onClick={() => setShowRegisterSheet(true)}
              >
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">Novo Profissional</span>
              </Button>
            </div>

            {/* Professionals List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Sua Equipe
                </h2>
                <span className="text-xs text-muted-foreground">
                  {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </span>
              </div>

              {summaryData.summaries.length === 0 ? (
                /* Empty State */
                <Card className="border-dashed border-2 border-border/50 bg-transparent">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Monte sua equipe!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                      Cadastre profissionais para acompanhar sessões e faturamento em tempo real.
                    </p>
                    <Button 
                      onClick={() => setShowRegisterSheet(true)}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Cadastrar Primeiro Profissional
                    </Button>
                    
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {summaryData.summaries.map((prof, index) => {
                    // Generate avatar color based on name
                    const colors = ['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                    const colorIndex = (prof.full_name?.charCodeAt(0) || index) % colors.length;
                    const avatarColor = colors[colorIndex];
                    const initial = prof.full_name?.charAt(0).toUpperCase() || '?';

                    return (
                      <button
                        key={prof.user_id}
                        onClick={() => navigate(`/manager/professional/${prof.user_id}`)}
                        className="w-full p-4 flex items-center justify-between rounded-xl bg-card/60 border border-border/30 hover:bg-card hover:border-border/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center`}>
                            <span className="text-white font-semibold text-sm">{initial}</span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {prof.full_name || 'Sem nome'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {prof.total_sessions} sessões
                              </span>
                              {prof.total_sessions > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-500">
                                  ativo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            {formatCurrency(prof.total_value)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Não foi possível carregar os dados.</p>
              <Button variant="outline" onClick={fetchSummary} className="mt-4">
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Register Professional Sheet */}
      <RegisterProfessionalSheet
        open={showRegisterSheet}
        onOpenChange={setShowRegisterSheet}
        onSuccess={() => {
          setShowRegisterSheet(false);
          fetchSummary();
        }}
      />
    </div>
  );
}
