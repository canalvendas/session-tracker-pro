import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

export const usePWAUpdate = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Verifica atualizações a cada 60 segundos
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update();
        });
      }, 60 * 1000);

      // Detecta quando um novo SW está esperando
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg);
          
          if (reg.waiting) {
            setNeedRefresh(true);
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          });
        }
      });

      // Recarrega quando o novo SW assume controle
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (needRefresh) {
      toast('Nova versão disponível!', {
        action: {
          label: 'Atualizar',
          onClick: updateServiceWorker,
        },
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return { needRefresh, updateServiceWorker };
};
