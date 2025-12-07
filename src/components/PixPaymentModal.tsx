import { useState, useEffect } from "react";
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
const MERCHANT_NAME = "TERADAY";
const MERCHANT_CITY = "RECIFE";
const AMOUNT = 19.90;

// Função para gerar payload PIX no formato EMV/BRCode
function generatePixPayload(): string {
  const formatField = (id: string, value: string): string => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  // Merchant Account Information (ID 26)
  const gui = formatField('00', 'BR.GOV.BCB.PIX');
  const pixKey = formatField('01', PIX_KEY);
  const merchantAccountInfo = formatField('26', gui + pixKey);

  // Campos principais
  const payloadFormatIndicator = formatField('00', '01');
  const merchantCategoryCode = formatField('52', '0000');
  const transactionCurrency = formatField('53', '986');
  const transactionAmount = formatField('54', AMOUNT.toFixed(2));
  const countryCode = formatField('58', 'BR');
  const merchantName = formatField('59', MERCHANT_NAME.substring(0, 25));
  const merchantCity = formatField('60', MERCHANT_CITY.substring(0, 15));
  
  // Additional Data Field (ID 62) - Transaction ID
  const txid = formatField('05', '***');
  const additionalDataField = formatField('62', txid);

  // Montar payload sem CRC
  const payloadWithoutCRC = 
    payloadFormatIndicator +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalDataField +
    '6304'; // CRC placeholder

  // Calcular CRC16-CCITT
  const crc = calculateCRC16(payloadWithoutCRC);
  
  return payloadWithoutCRC + crc;
}

// Função CRC16-CCITT conforme especificação do Banco Central
function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Componente de QR Code com tratamento de erro e tamanho responsivo
function SafeQRCode() {
  const [hasError, setHasError] = useState(false);
  const [QRCodeComponent, setQRCodeComponent] = useState<React.ComponentType<any> | null>(null);
  const [qrSize, setQrSize] = useState(140);

  // Detecta tamanho da tela para QR Code responsivo
  useEffect(() => {
    const updateSize = () => {
      setQrSize(window.innerWidth >= 640 ? 180 : 140);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Carrega o componente QRCode de forma dinâmica
  useEffect(() => {
    import("qrcode.react")
      .then((mod) => {
        setQRCodeComponent(() => mod.QRCodeSVG);
      })
      .catch((err) => {
        console.error("Erro ao carregar QRCode:", err);
        setHasError(true);
      });
  }, []);

  if (hasError || !QRCodeComponent) {
    return (
      <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] flex items-center justify-center text-gray-500 text-sm text-center p-4">
        {hasError ? "QR Code indisponível. Use a chave PIX abaixo." : "Carregando..."}
      </div>
    );
  }

  try {
    return (
      <QRCodeComponent
        value={generatePixPayload()}
        size={qrSize}
        level="M"
        includeMargin={false}
      />
    );
  } catch (error) {
    console.error("Erro ao renderizar QR Code:", error);
    return (
      <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] flex items-center justify-center text-gray-500 text-sm text-center p-4">
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
      "Olá! Acabei de efetuar o pagamento da assinatura mensal do TeraDay (R$19,90). Segue o comprovante:"
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white w-[95vw] max-w-md sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl font-bold">
            💳 Pagamento via PIX
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-2 sm:p-4 rounded-xl">
              <SafeQRCode />
            </div>
            <p className="text-gray-400 text-xs sm:text-sm mt-2 sm:mt-3 text-center px-2">
              Escaneie o QR Code com seu app de banco
            </p>
          </div>

          {/* Valor */}
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">R$ 19,90</p>
            <p className="text-gray-400 text-xs sm:text-sm">Assinatura Mensal</p>
          </div>

          {/* Chave PIX */}
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm text-gray-400 text-center">Ou copie a chave PIX:</p>
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 sm:p-3">
              <span className="flex-1 text-xs sm:text-sm truncate">{PIX_KEY}</span>
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
          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm font-medium">📱 Como pagar:</p>
            <ol className="text-xs sm:text-sm text-gray-400 space-y-0.5 sm:space-y-1 list-decimal list-inside">
              <li>Escaneie o QR Code ou copie a chave PIX</li>
              <li>Faça o pagamento no seu app de banco</li>
              <li>Envie o comprovante pelo WhatsApp abaixo</li>
            </ol>
          </div>

          {/* Botão WhatsApp */}
          <Button
            onClick={handleWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 sm:py-6 text-sm sm:text-base"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Enviar Comprovante via WhatsApp
          </Button>

          <p className="text-xs text-gray-500 text-center px-2">
            Após confirmarmos o pagamento, seu acesso será liberado em até 24 horas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
