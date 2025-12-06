import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, MessageCircle, X } from "lucide-react";
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
const PIX_VALUE = "14.99";
const WHATSAPP_NUMBER = "5581986953506";

// Payload PIX para QR Code (formato EMV)
const generatePixPayload = () => {
  const pixPayload = `00020126580014br.gov.bcb.pix0136${PIX_KEY}5204000053039865406${PIX_VALUE}5802BR5925TeraDay6009SAO PAULO62070503***6304`;
  return pixPayload;
};

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
      "Olá! Acabei de efetuar o pagamento do TeraDay (R$14,99). Segue o comprovante:"
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
              <QRCodeSVG
                value={generatePixPayload()}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-gray-400 text-sm mt-3">
              Escaneie o QR Code com seu app de banco
            </p>
          </div>

          {/* Valor */}
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">R$ 14,99</p>
            <p className="text-gray-400 text-sm">Acesso Vitalício</p>
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
