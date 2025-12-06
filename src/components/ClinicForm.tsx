import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clinic, ClinicFormData } from "@/types/clinic";

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
  const [color, setColor] = useState(CLINIC_COLORS[0]);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clinic) {
      setName(clinic.name);
      setSessionValue(clinic.session_value.toString());
      setColor(clinic.color);
      setIsDefault(clinic.is_default);
    } else {
      setName("");
      setSessionValue("40");
      setColor(CLINIC_COLORS[0]);
      setIsDefault(false);
    }
  }, [clinic, open]);

  const handleSubmit = async () => {
    const value = parseFloat(sessionValue);
    if (!name.trim() || isNaN(value) || value <= 0) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        session_value: value,
        color,
        is_default: isDefault || isOnlyClinic || false,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{clinic ? "Editar Clínica" : "Nova Clínica"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
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

          {/* Session Value */}
          <div className="space-y-2">
            <Label htmlFor="session-value">Valor da sessão</Label>
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

        <DialogFooter>
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
