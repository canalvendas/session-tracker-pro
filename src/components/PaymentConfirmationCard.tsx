import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Sparkles, CreditCard, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  reference_month: number;
  reference_year: number;
  notes: string | null;
  seen_by_professional: boolean;
}

interface PaymentConfirmationCardProps {
  userId: string;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function PaymentConfirmationCard({ userId }: PaymentConfirmationCardProps) {
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(false);
  const markedAsSeenRef = useRef(false);

  useEffect(() => {
    const fetchLatestPayment = async () => {
      try {
        // First get the profile id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, manager_id")
          .eq("user_id", userId)
          .single();

        if (!profile?.manager_id) {
          setLoading(false);
          return;
        }

        // Fetch latest payment
        const { data: payments, error } = await supabase
          .from("professional_payments")
          .select("*")
          .eq("professional_id", profile.id)
          .order("payment_date", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (payments && payments.length > 0) {
          const latestPayment = payments[0] as Payment;
          setPayment(latestPayment);
          setIsNew(!latestPayment.seen_by_professional);
        }
      } catch (error) {
        console.error("Error fetching payment:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchLatestPayment();
    }
  }, [userId]);

  // Mark as seen after 2 seconds
  useEffect(() => {
    if (payment && isNew && !markedAsSeenRef.current) {
      const timer = setTimeout(async () => {
        try {
          markedAsSeenRef.current = true;
          await supabase
            .from("professional_payments")
            .update({ seen_by_professional: true })
            .eq("id", payment.id);
          setIsNew(false);
        } catch (error) {
          console.error("Error marking payment as seen:", error);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [payment, isNew]);

  if (loading || !payment) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const paymentMonth = months[payment.reference_month - 1];
  const formattedDate = format(
    new Date(payment.payment_date + "T12:00:00"),
    "d 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
      {/* "NOVO" Badge */}
      {isNew && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 animate-pulse shadow-lg">
          <Sparkles className="h-3 w-3 text-white" />
          <span className="text-xs font-bold text-white">NOVO</span>
        </div>
      )}

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 animate-pulse">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-semibold text-green-500">Pagamento Confirmado</span>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {formatCurrency(payment.amount)}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Referente a:</span>
            <span className="font-medium text-foreground">
              {paymentMonth}/{payment.reference_year}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Pago em:</span>
            <span className="font-medium text-foreground">{formattedDate}</span>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">
            Pagamento confirmado pela clínica
          </span>
        </div>

        {/* Action */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => navigate("/pagamentos")}
        >
          Ver Histórico de Pagamentos
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}