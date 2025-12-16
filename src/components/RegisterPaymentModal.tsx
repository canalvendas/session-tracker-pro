import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DollarSign, Calendar, FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  reference_month: number;
  reference_year: number;
  notes: string | null;
}

interface RegisterPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
  onSuccess: () => void;
  editPayment?: Payment | null;
}

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

export function RegisterPaymentModal({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  onSuccess,
  editPayment,
}: RegisterPaymentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [referenceMonth, setReferenceMonth] = useState(new Date().getMonth() + 1);
  const [referenceYear, setReferenceYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState("");

  const isEditMode = !!editPayment;
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i + 1);

  // Preencher formulário quando em modo edição
  useEffect(() => {
    if (editPayment && open) {
      setAmount(String(editPayment.amount).replace(".", ","));
      setPaymentDate(editPayment.payment_date);
      setReferenceMonth(editPayment.reference_month);
      setReferenceYear(editPayment.reference_year);
      setNotes(editPayment.notes || "");
    } else if (!editPayment && open) {
      // Reset form for new payment
      setAmount("");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setReferenceMonth(new Date().getMonth() + 1);
      setReferenceYear(new Date().getFullYear());
      setNotes("");
    }
  }, [editPayment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount.replace(/[^\d,.-]/g, "").replace(",", "."));
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido para o pagamento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (isEditMode) {
        // Atualizar pagamento existente
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=update-payment`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentId: editPayment.id,
              amount: numAmount,
              paymentDate,
              referenceMonth,
              referenceYear,
              notes: notes.trim() || null,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao atualizar pagamento");
        }

        toast({
          title: "Pagamento atualizado",
          description: `Pagamento de R$ ${numAmount.toFixed(2)} atualizado com sucesso.`,
        });
      } else {
        // Criar novo pagamento
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manager-users?action=register-payment`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              professionalId,
              amount: numAmount,
              paymentDate,
              referenceMonth,
              referenceYear,
              notes: notes.trim() || null,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao registrar pagamento");
        }

        toast({
          title: "Pagamento registrado",
          description: `Pagamento de R$ ${numAmount.toFixed(2)} registrado com sucesso.`,
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving payment:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyInput = (value: string) => {
    const cleanValue = value.replace(/[^\d,.-]/g, "");
    setAmount(cleanValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/20">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            {isEditMode ? "Editar Pagamento" : "Registrar Pagamento"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? "Edite os dados do pagamento para " : "Registre um pagamento para "}
            <span className="font-semibold text-foreground">{professionalName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Valor do Pagamento
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="amount"
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => formatCurrencyInput(e.target.value)}
                className="pl-10 text-lg font-semibold"
                required
              />
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Data do Pagamento
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          {/* Reference Month/Year */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Mês de Referência
            </Label>
            <div className="flex gap-2">
              <Select value={String(referenceMonth)} onValueChange={(v) => setReferenceMonth(Number(v))}>
                <SelectTrigger className="flex-1">
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
              <Select value={String(referenceYear)} onValueChange={(v) => setReferenceYear(Number(v))}>
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
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Observações (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre este pagamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Salvando..." : "Registrando..."}
                </>
              ) : (
                isEditMode ? "Salvar Alterações" : "Confirmar Pagamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
