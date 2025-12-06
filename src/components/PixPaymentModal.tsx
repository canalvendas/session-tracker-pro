import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PIX_KEY = "pixmusetera@gmail.com";
const WHATSAPP_NUMBER = "5581986953506";

// Componente de QR Code com tratamento de erro
function SafeQRCode() {
  const [hasError, setHasError] = useState(false);
  const [QRCodeComponent, setQRCodeComponent] = useState<React.ComponentType<any> | null>(null);

  // Carrega o componente QRCode de forma dinâmica
  useState(() => {
    import("qrcode.react")
      .then((mod) => {
        setQRCodeComponent(() => mod.QRCodeSVG);
      })
      .catch((err) => {
        console.error("Erro ao carregar QRCode:", err);
        setHasError(true);
      });
  });

  if (hasError || !QRCodeComponent) {
    return (
      <div className="w-[180px] h-[180px] flex items-center justify-center text-gray-500 text-sm text-center p-4">
        {hasError ? "QR Code indisponível. Use a chave PIX abaixo." : "Carregando..."}
      </div>
    );
  }

  try {
    return (
      <QRCodeComponent
        value={PIX_KEY}
        size={180}
        level="M"
        includeMargin={false}
      />
    );
  } catch (error) {
    console.error("Erro ao renderizar QR Code:", error);
    return (
      <div className="w-[180px] h-[180px] flex items-center justify-center text-gray-500 text-sm text-center p-4">
        QR Code indisponível. Use a chave PIX abaixo.
      </div>
    );
  }
}

export function PixPaymentModal({ open, onOpenChange }: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      toast({
        title: "Chave PIX copiada!",
        description: "Cole no seu app de banco para pagar.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "Olá! Acabei de efetuar o pagamento da assinatura mensal do TeraDay (R$14,99). Segue o comprovante:"
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            💳 Pagamento via PIX
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl">
              <SafeQRCode />
            </div>
            <p className="text-gray-400 text-sm mt-3">
              Escaneie o QR Code com seu app de banco
            </p>
          </div>

          {/* Valor */}
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">R$ 14,99</p>
            <p className="text-gray-400 text-sm">Assinatura Mensal</p>
          </div>

          {/* Chave PIX */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400 text-center">Ou copie a chave PIX:</p>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-3">
              <span className="flex-1 text-sm truncate">{PIX_KEY}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyPix}
                className="shrink-0 hover:bg-gray-700"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">📱 Como pagar:</p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Escaneie o QR Code ou copie a chave PIX</li>
              <li>Faça o pagamento no seu app de banco</li>
              <li>Envie o comprovante pelo WhatsApp abaixo</li>
            </ol>
          </div>

          {/* Botão WhatsApp */}
          <Button
            onClick={handleWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Enviar Comprovante via WhatsApp
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Após confirmarmos o pagamento, seu acesso será liberado em até 24 horas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
