import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Clinic } from "@/types/clinic";

interface AddSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSession: (date: Date, count: number, clinicId?: string) => Promise<any>;
  sessionValue: number;
  clinics: Clinic[];
  defaultClinic: Clinic | null;
}

export function AddSessionSheet({ 
  open, 
  onOpenChange, 
  onAddSession,
  sessionValue,
  clinics,
  defaultClinic,
}: AddSessionSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [count, setCount] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  // Reset selected clinic when sheet opens
  useEffect(() => {
    if (open) {
      setSelectedClinicId(defaultClinic?.id);
      setCount(1);
      setSelectedDate(new Date());
    }
  }, [open, defaultClinic]);

  const selectedClinic = clinics.find(c => c.id === selectedClinicId);
  const currentSessionValue = selectedClinic?.session_value ?? sessionValue;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await onAddSession(selectedDate, count, selectedClinicId);
      if (result) {
        const clinicName = selectedClinic?.name ? ` (${selectedClinic.name})` : '';
        toast({
          title: "Sessão registrada!",
          description: `${count} ${count === 1 ? 'sessão adicionada' : 'sessões adicionadas'} para ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}${clinicName}`,
        });
        setCount(1);
        onOpenChange(false);
      } else {
        toast({
          title: "Erro ao registrar",
          description: "Não foi possível salvar a sessão. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = async () => {
    setIsSubmitting(true);
    try {
      const result = await onAddSession(new Date(), 1, defaultClinic?.id);
      if (result) {
        const clinicName = defaultClinic?.name ? ` (${defaultClinic.name})` : '';
        toast({
          title: "Sessão registrada!",
          description: `1 sessão adicionada para hoje${clinicName}`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Erro ao registrar",
          description: "Não foi possível salvar a sessão. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Registrar Sessões</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Quick Add Button */}
          <Button 
            variant="accent" 
            size="lg" 
            className="w-full"
            onClick={handleQuickAdd}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Plus className="h-5 w-5 mr-2" />
            )}
            Adicionar 1 sessão agora
            {defaultClinic && (
              <span className="ml-1 opacity-75">({defaultClinic.name})</span>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                ou registre manualmente
              </span>
            </div>
          </div>

          {/* Clinic Selector - Only show if multiple clinics */}
          {clinics.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Clínica / Local
              </label>
              <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione uma clínica">
                    {selectedClinic && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedClinic.color }}
                        />
                        <span>{selectedClinic.name}</span>
                        <span className="text-muted-foreground">
                          ({formatCurrency(selectedClinic.session_value)})
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: clinic.color }}
                        />
                        <span>{clinic.name}</span>
                        <span className="text-muted-foreground">
                          ({formatCurrency(clinic.session_value)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Single clinic indicator */}
          {clinics.length === 1 && clinics[0] && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: clinics[0].color }}
              />
              <span className="text-sm font-medium">{clinics[0].name}</span>
              <span className="text-sm text-muted-foreground">
                ({formatCurrency(clinics[0].session_value)})
              </span>
            </div>
          )}

          {/* No clinics message */}
          {clinics.length === 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Cadastre uma clínica em Configurações para definir o valor das sessões.
              </p>
            </div>
          )}

          {/* Date Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Data
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                  {selectedDate ? (
                    format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Count Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Quantidade de sessões
            </label>
            <div className="flex items-center justify-center gap-6 py-4">
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => setCount(Math.max(1, count - 1))}
                disabled={count <= 1}
              >
                <Minus className="h-6 w-6" />
              </Button>
              <div className="text-center min-w-[100px]">
                <span className="text-5xl font-bold text-foreground tabular-nums">
                  {count}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {count === 1 ? 'sessão' : 'sessões'}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => setCount(count + 1)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Value Preview */}
          <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor total</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(count * currentSessionValue)}
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            size="xl" 
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : `Registrar ${count} ${count === 1 ? 'sessão' : 'sessões'}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
