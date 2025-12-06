import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, Share, MoreVertical, Plus } from "lucide-react";
import logoTeraDay from "@/assets/logo-teraday-transparent.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop" | "unknown";

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform("ios");
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInWebAppiOS = (navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      console.log("[PWA] App already installed");
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      // Show again after 24 hours
      if (hoursSinceDismissed < 24) {
        console.log("[PWA] Prompt was dismissed less than 24 hours ago");
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA] beforeinstallprompt event fired");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show prompt after 2 seconds
    const timer = setTimeout(() => {
      console.log("[PWA] Showing install prompt after 2 seconds");
      setShowPrompt(true);
    }, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    console.log("[PWA] Install button clicked");
    
    if (deferredPrompt) {
      console.log("[PWA] Using native install prompt");
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("[PWA] User choice:", outcome);
        
        if (outcome === "accepted") {
          setShowPrompt(false);
          setDeferredPrompt(null);
        }
      } catch (error) {
        console.error("[PWA] Error during installation:", error);
        setShowManualInstructions(true);
      }
    } else {
      console.log("[PWA] No deferred prompt, showing manual instructions");
      setShowManualInstructions(true);
    }
  };

  const handleDismiss = () => {
    console.log("[PWA] Prompt dismissed");
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <Card variant="elevated" className="w-full max-w-md relative overflow-hidden animate-slide-up">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Fechar"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {!showManualInstructions ? (
          <>
            {/* App Icon */}
            <div className="flex flex-col items-center text-center mb-6">
              <img 
                src={logoTeraDay} 
                alt="TeraDay" 
                className="h-20 w-20 rounded-2xl shadow-glow mb-4 object-contain"
              />
              <h2 className="text-xl font-bold text-foreground">
                Instalar <span className="text-primary">Tera</span><span className="text-primary/70">Day</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Instale o app para acesso rápido, funcionamento offline e melhor experiência!
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Acesso direto</p>
                  <p className="text-xs text-muted-foreground">Abra direto da tela inicial</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Super rápido</p>
                  <p className="text-xs text-muted-foreground">Carregamento instantâneo</p>
                </div>
              </div>
            </div>

            {/* Install Button */}
            <Button size="xl" className="w-full" onClick={handleInstall}>
              <Download className="h-5 w-5 mr-2" />
              Instalar Agora
            </Button>

            <button
              onClick={handleDismiss}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Agora não
            </button>
          </>
        ) : (
          <>
            {/* Manual Instructions */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">Como instalar</h2>
              <p className="text-sm text-muted-foreground">
                Siga os passos abaixo para instalar o app
              </p>
            </div>

            {platform === "ios" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Toque no botão de compartilhar
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Share className="h-6 w-6 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        (ícone de compartilhar na barra do Safari)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Toque em "Adicionar à Tela de Início"
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Plus className="h-6 w-6 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Role para baixo se necessário
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Toque em "Adicionar"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pronto! O app aparecerá na sua tela inicial
                    </p>
                  </div>
                </div>
              </div>
            )}

            {platform === "android" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Toque no menu do navegador
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <MoreVertical className="h-6 w-6 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        (três pontinhos no canto superior)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Toque em "Instalar app" ou "Adicionar à tela inicial"
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Confirme a instalação
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pronto! O app aparecerá na sua tela inicial
                    </p>
                  </div>
                </div>
              </div>
            )}

            {platform === "desktop" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Procure o ícone de instalação
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Na barra de endereço do navegador, procure por um ícone de "+" ou de instalação
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Clique para instalar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confirme a instalação na janela que aparecer
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="lg"
              className="w-full mt-6"
              onClick={() => setShowManualInstructions(false)}
            >
              Voltar
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
