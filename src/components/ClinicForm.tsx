import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clinic, ClinicFormData, PaymentType } from "@/types/clinic";
import { cn } from "@/lib/utils";

const CLINIC_COLORS = [
  "#3d8b7d", // Teal (default)
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#ef4444", // Red
  "#3b82f6", // Blue
];

interface ClinicFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ClinicFormData) => Promise<void>;
  clinic?: Clinic | null;
  isOnlyClinic?: boolean;
}

export function ClinicForm({ open, onOpenChange, onSave, clinic, isOnlyClinic }: ClinicFormProps) {
  const [name, setName] = useState("");
  const [sessionValue, setSessionValue] = useState("40");
  const [shiftValue, setShiftValue] = useState("200");
  const [paymentType, setPaymentType] = useState<PaymentType>("session");
  const [color, setColor] = useState(CLINIC_COLORS[0]);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clinic) {
      setName(clinic.name);
      setSessionValue(clinic.session_value.toString());
      setShiftValue(clinic.shift_value?.toString() || "200");
      setPaymentType(clinic.payment_type || "session");
      setColor(clinic.color);
      setIsDefault(clinic.is_default);
    } else {
      setName("");
      setSessionValue("40");
      setShiftValue("200");
      setPaymentType("session");
      setColor(CLINIC_COLORS[0]);
      setIsDefault(false);
    }
  }, [clinic, open]);

  const handleSubmit = async () => {
    const sessionVal = parseFloat(sessionValue);
    const shiftVal = parseFloat(shiftValue);
    
    if (!name.trim()) return;
    if (paymentType === "session" && (isNaN(sessionVal) || sessionVal <= 0)) return;
    if (paymentType === "shift" && (isNaN(shiftVal) || shiftVal <= 0)) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        session_value: sessionVal || 0,
        shift_value: shiftVal || 0,
        payment_type: paymentType,
        color,
        is_default: isDefault || isOnlyClinic || false,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{clinic ? "Editar Clínica" : "Nova Clínica"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 overflow-y-auto flex-1 pr-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="clinic-name">Nome da clínica</Label>
            <Input
              id="clinic-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clínica São Paulo"
              className="h-12"
            />
          </div>

          {/* Payment Type Toggle */}
          <div className="space-y-2">
            <Label>Tipo de pagamento</Label>
            <div className="flex rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setPaymentType("session")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                  paymentType === "session"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Por sessão
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("shift")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                  paymentType === "shift"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Por turno
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentType === "session" 
                ? "Valor calculado por quantidade de sessões realizadas"
                : "Valor fixo por turno de trabalho, independente do número de sessões"
              }
            </p>
          </div>

          {/* Session Value - Only show when payment type is session */}
          {paymentType === "session" && (
            <div className="space-y-2">
              <Label htmlFor="session-value">Valor por sessão</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="session-value"
                  type="number"
                  value={sessionValue}
                  onChange={(e) => setSessionValue(e.target.value)}
                  className="pl-12 h-12 text-lg font-semibold"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Shift Value - Only show when payment type is shift */}
          {paymentType === "shift" && (
            <div className="space-y-2">
              <Label htmlFor="shift-value">Valor do turno</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="shift-value"
                  type="number"
                  value={shiftValue}
                  onChange={(e) => setShiftValue(e.target.value)}
                  className="pl-12 h-12 text-lg font-semibold"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Este valor será registrado independente do número de sessões
              </p>
            </div>
          )}

          {/* Color */}
          <div className="space-y-2">
            <Label>Cor de identificação</Label>
            <div className="flex flex-wrap gap-2">
              {CLINIC_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    color === c 
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" 
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Default toggle */}
          {!isOnlyClinic && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div>
                <Label htmlFor="is-default" className="font-medium">Clínica padrão</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Usada no botão de adição rápida
                </p>
              </div>
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Salvando..." : clinic ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
