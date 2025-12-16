import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Calendar, TrendingUp, DollarSign, Wallet, CheckCircle2, Pencil, Trash2 } from "lucide-react";
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
import { RegisterPaymentModal } from "@/components/RegisterPaymentModal";

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

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  reference_month: number;
  reference_year: number;
  notes: string | null;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function ManagerProfessionalDetail() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

      // Fetch payments
      if (professional) {
        const paymentsResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=payments&professionalId=${professional.id}`,
          {
            headers: {
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (paymentsResponse.ok) {
          const paymentsResult = await paymentsResponse.json();
          setPayments(paymentsResult.payments || []);
        }
      }
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
  }, [userId, selectedMonth, selectedYear, professional?.id]);

  const fetchPayments = async () => {
    if (!professional) return;
    
    try {
      const paymentsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=payments&professionalId=${professional.id}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (paymentsResponse.ok) {
        const paymentsResult = await paymentsResponse.json();
        setPayments(paymentsResult.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=delete-payment&paymentId=${deletingPayment.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao excluir pagamento");
      }

      toast({
        title: "Pagamento excluído",
        description: "O pagamento foi excluído com sucesso.",
      });

      setDeletingPayment(null);
      fetchPayments();
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o pagamento.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = (open: boolean) => {
    setShowPaymentModal(open);
    if (!open) {
      setEditingPayment(null);
    }
  };

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
          
          {/* Payment Button */}
          {professional && (
            <Button 
              size="sm" 
              className="mt-3 w-full sm:w-auto"
              onClick={() => {
                setEditingPayment(null);
                setShowPaymentModal(true);
              }}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Registrar Pagamento
            </Button>
          )}
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

            {/* Payment History */}
            <Card className="bg-card/80 border-border/50 mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {payments.length === 0 ? (
                  <div className="p-8 text-center">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum pagamento registrado.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {payments.slice(0, 5).map((payment) => {
                      const formattedDate = format(
                        new Date(payment.payment_date + "T12:00:00"),
                        "d 'de' MMMM",
                        { locale: ptBR }
                      );
                      const paymentMonth = monthNames[payment.reference_month - 1];

                      return (
                        <div key={payment.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="font-medium text-foreground">
                                  {paymentMonth}/{payment.reference_year}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Pago em {formattedDate}
                              </p>
                              {payment.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  {payment.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-primary">
                                {formatCurrency(Number(payment.amount))}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditPayment(payment)}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeletingPayment(payment)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </div>
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

      {/* Payment Modal */}
      {professional && (
        <RegisterPaymentModal
          open={showPaymentModal}
          onOpenChange={handleClosePaymentModal}
          professionalId={professional.id}
          professionalName={professional.full_name || 'Profissional'}
          onSuccess={fetchPayments}
          editPayment={editingPayment}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPayment} onOpenChange={(open) => !open && setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pagamento de{" "}
              <span className="font-semibold text-foreground">
                {deletingPayment && formatCurrency(Number(deletingPayment.amount))}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
