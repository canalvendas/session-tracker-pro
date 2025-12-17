import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Minus, Plus, Clock, Stethoscope } from "lucide-react";
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
  const isShiftPayment = selectedClinic?.payment_type === 'shift';
  
  // For shift payment, value is fixed; for session payment, multiply by count
  const currentValue = isShiftPayment 
    ? (selectedClinic?.shift_value ?? 0)
    : (selectedClinic?.session_value ?? sessionValue) * count;

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
        const message = isShiftPayment
          ? `1 turno registrado com ${count} ${count === 1 ? 'sessão' : 'sessões'} para ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}${clinicName}`
          : `${count} ${count === 1 ? 'sessão adicionada' : 'sessões adicionadas'} para ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}${clinicName}`;
        
        toast({
          title: isShiftPayment ? "Turno registrado!" : "Sessão registrada!",
          description: message,
        });
        setCount(1);
        onOpenChange(false);
      } else {
        toast({
          title: "Erro ao registrar",
          description: "Não foi possível salvar. Tente novamente.",
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
        const isDefaultShift = defaultClinic?.payment_type === 'shift';
        toast({
          title: isDefaultShift ? "Turno registrado!" : "Sessão registrada!",
          description: isDefaultShift 
            ? `1 turno registrado para hoje${clinicName}`
            : `1 sessão adicionada para hoje${clinicName}`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Erro ao registrar",
          description: "Não foi possível salvar. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClinicDisplayValue = (clinic: Clinic) => {
    if (clinic.payment_type === 'shift') {
      return `${formatCurrency(clinic.shift_value)}/turno`;
    }
    return `${formatCurrency(clinic.session_value)}/sessão`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">
            {isShiftPayment ? "Registrar Turno" : "Registrar Sessões"}
          </SheetTitle>
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
            ) : defaultClinic?.payment_type === 'shift' ? (
              <Clock className="h-5 w-5 mr-2" />
            ) : (
              <Plus className="h-5 w-5 mr-2" />
            )}
            {defaultClinic?.payment_type === 'shift' 
              ? "Adicionar 1 turno agora"
              : "Adicionar 1 sessão agora"
            }
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
                        <span className="text-muted-foreground text-xs">
                          {getClinicDisplayValue(selectedClinic)}
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
                        <span className="text-muted-foreground text-xs ml-1">
                          {clinic.payment_type === 'shift' ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getClinicDisplayValue(clinic)}
                            </span>
                          ) : (
                            getClinicDisplayValue(clinic)
                          )}
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
                {clinics[0].payment_type === 'shift' && <Clock className="h-3 w-3 inline mr-1" />}
                {getClinicDisplayValue(clinics[0])}
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

          {/* Count Selector - Different UI for shift vs session */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {isShiftPayment ? "Sessões realizadas no turno" : "Quantidade de sessões"}
            </label>
            
            {isShiftPayment && (
              <p className="text-xs text-muted-foreground">
                O valor do turno é fixo. Informe quantas sessões você realizou (opcional, para controle)
              </p>
            )}
            
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
          <div className={cn(
            "rounded-xl p-4 text-center",
            isShiftPayment ? "bg-primary/10 border border-primary/20" : "bg-secondary"
          )}>
            {isShiftPayment ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Valor do turno (fixo)</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(currentValue)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-1">Valor total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(currentValue)}
                </p>
              </>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            size="xl" 
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : isShiftPayment 
              ? `Registrar turno (${count} ${count === 1 ? 'sessão' : 'sessões'})`
              : `Registrar ${count} ${count === 1 ? 'sessão' : 'sessões'}`
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
