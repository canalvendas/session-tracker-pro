import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  Calendar as CalendarIcon,
  TrendingUp,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  reference_month: number;
  reference_year: number;
  notes: string | null;
  created_at: string;
}

interface PaymentHistoryPageProps {
  user: User | null;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function PaymentHistoryPage({ user }: PaymentHistoryPageProps) {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;

      try {
        // Get profile id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        // Fetch all payments
        const { data, error } = await supabase
          .from("professional_payments")
          .select("*")
          .eq("professional_id", profile.id)
          .order("payment_date", { ascending: false });

        if (error) throw error;
        setPayments((data || []) as Payment[]);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const lastThreeMonths = payments.slice(0, 3);
  const lastThreeMonthsTotal = lastThreeMonths.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="min-h-screen gradient-surface pb-24">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Meus Pagamentos</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Total Recebido
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalReceived)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {payments.length} {payments.length === 1 ? 'pagamento' : 'pagamentos'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Últimos 3 meses
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(lastThreeMonthsTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastThreeMonths.length} {lastThreeMonths.length === 1 ? 'pagamento' : 'pagamentos'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card className="bg-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Histórico Completo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : payments.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum pagamento registrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {payments.map((payment) => {
                  const formattedDate = format(
                    new Date(payment.payment_date + "T12:00:00"),
                    "d 'de' MMMM",
                    { locale: ptBR }
                  );
                  const paymentMonth = months[payment.reference_month - 1];

                  return (
                    <div key={payment.id} className="p-4 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">
                              {paymentMonth} {payment.reference_year}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span>Pago em {formattedDate}</span>
                          </div>
                          {payment.notes && (
                            <p className="mt-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-md">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(Number(payment.amount))}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
