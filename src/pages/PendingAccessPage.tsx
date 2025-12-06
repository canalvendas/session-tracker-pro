import { Clock, MessageCircle, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PendingAccessPageProps {
  signOut: () => Promise<{ error: any }>;
  userEmail?: string;
}

const WHATSAPP_NUMBER = "5581986953506";

export function PendingAccessPage({ signOut, userEmail }: PendingAccessPageProps) {
  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Olá! Fiz o pagamento do TeraDay e estou aguardando a liberação do acesso.\n\nEmail cadastrado: ${userEmail || 'não informado'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Ícone animado */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-lg">⏳</span>
              </div>
            </div>

            {/* Título e mensagem */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Aguardando Liberação
              </h1>
              <p className="text-muted-foreground">
                Seu cadastro foi realizado com sucesso! Assim que confirmarmos o pagamento, 
                seu acesso será liberado automaticamente.
              </p>
            </div>

            {/* Email cadastrado */}
            {userEmail && (
              <div className="w-full p-3 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">Email cadastrado:</span>
                <br />
                <span className="text-foreground font-medium">{userEmail}</span>
              </div>
            )}

            {/* Instruções */}
            <div className="w-full space-y-3 text-left">
              <p className="text-sm font-medium text-foreground">Próximos passos:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Envie o comprovante de pagamento pelo WhatsApp</li>
                <li>Aguarde a confirmação (geralmente em até 1 hora)</li>
                <li>Recarregue esta página para acessar o app</li>
              </ol>
            </div>

            {/* Botões de ação */}
            <div className="w-full space-y-3 pt-2">
              <Button 
                onClick={handleWhatsAppContact}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar Comprovante via WhatsApp
              </Button>

              <Button 
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Verificar Liberação
              </Button>

              <Button 
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair e usar outra conta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
