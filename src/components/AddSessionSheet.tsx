import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSession: (date: Date, count: number) => void;
  sessionValue: number;
}

export function AddSessionSheet({ 
  open, 
  onOpenChange, 
  onAddSession,
  sessionValue 
}: AddSessionSheetProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [count, setCount] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleSubmit = () => {
    onAddSession(selectedDate, count);
    toast({
      title: "Sessão registrada!",
      description: `${count} ${count === 1 ? 'sessão adicionada' : 'sessões adicionadas'} para ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}`,
    });
    setCount(1);
    onOpenChange(false);
  };

  const handleQuickAdd = () => {
    onAddSession(new Date(), 1);
    toast({
      title: "Sessão registrada!",
      description: "1 sessão adicionada para hoje",
    });
    onOpenChange(false);
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
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar 1 sessão agora
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
              {formatCurrency(count * sessionValue)}
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            size="xl" 
            className="w-full"
            onClick={handleSubmit}
          >
            Registrar {count} {count === 1 ? 'sessão' : 'sessões'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
