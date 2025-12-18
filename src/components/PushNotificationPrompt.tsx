import { Bell, BellOff, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PushNotificationPromptProps {
  userId: string;
}

export function PushNotificationPrompt({ userId }: PushNotificationPromptProps) {
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const {
    permission,
    isSubscribed,
    isSupported,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications(userId);

  // Don't show if not supported, loading, or already subscribed
  if (!isSupported || isLoading || isSubscribed || dismissed) {
    return null;
  }

  // Don't show if permission was denied
  if (permission === 'denied') {
    return null;
  }

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: "Notificações ativadas!",
        description: "Você receberá alertas quando receber pagamentos.",
      });
    } else if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
        aria-label="Fechar"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex-shrink-0 p-3 rounded-full bg-primary/20">
          <Bell className="h-6 w-6 text-primary animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Ative as notificações</h3>
          <p className="text-xs text-muted-foreground">
            Receba alertas quando seu gestor registrar pagamentos
          </p>
        </div>

        <Button 
          onClick={handleSubscribe}
          disabled={isLoading}
          size="sm"
          className="flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Ativar"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Compact version for settings page
export function PushNotificationToggle({ userId }: PushNotificationPromptProps) {
  const { toast } = useToast();
  const {
    isSubscribed,
    isSupported,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications(userId);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <BellOff className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Notificações Push</p>
          <p className="text-xs text-muted-foreground">
            Não suportado neste navegador
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais alertas push.",
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá alertas quando receber pagamentos.",
        });
      } else if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
      {isSubscribed ? (
        <Bell className="h-5 w-5 text-primary" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">Notificações Push</p>
        <p className="text-xs text-muted-foreground">
          {isSubscribed ? "Ativadas - Você receberá alertas" : "Desativadas"}
        </p>
      </div>
      <Button
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <>
            <Check className="h-4 w-4 mr-1" />
            Ativado
          </>
        ) : (
          "Ativar"
        )}
      </Button>
    </div>
  );
}
