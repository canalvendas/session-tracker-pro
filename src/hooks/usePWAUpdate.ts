import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export const usePWAUpdate = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const toastIdRef = useRef<string | number | null>(null);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      console.log('[PWA] Aplicando atualização...');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // Função para verificar atualizações
  const checkForUpdates = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          console.log('[PWA] Verificando atualizações...');
          reg.update();
        }
      });
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Verifica IMEDIATAMENTE ao carregar
      checkForUpdates();

      // Depois verifica a cada 30 segundos
      const interval = setInterval(checkForUpdates, 30 * 1000);

      // Detecta quando um novo SW está esperando
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg);
          
          if (reg.waiting) {
            console.log('[PWA] Nova versão já está esperando!');
            setNeedRefresh(true);
          }

          reg.addEventListener('updatefound', () => {
            console.log('[PWA] Atualização encontrada!');
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Nova versão instalada e pronta!');
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
  }, [checkForUpdates]);

  // Toast mais proeminente e persistente
  useEffect(() => {
    if (needRefresh) {
      // Dismiss toast anterior se existir
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      // Mostrar toast proeminente
      toastIdRef.current = toast.success('🚀 Nova versão disponível!', {
        description: 'Uma atualização importante está pronta. Clique para atualizar agora.',
        action: {
          label: '✨ Atualizar Agora',
          onClick: updateServiceWorker,
        },
        duration: Infinity,
        closeButton: false,
      });

      // Re-exibir toast a cada 15 segundos se usuário ignorar
      const reminderInterval = setInterval(() => {
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
        }
        toastIdRef.current = toast.warning('⚠️ Atualização pendente!', {
          description: 'Você está usando uma versão antiga. Atualize agora!',
          action: {
            label: '🔄 Atualizar',
            onClick: updateServiceWorker,
          },
          duration: Infinity,
          closeButton: false,
        });
      }, 15 * 1000);

      return () => clearInterval(reminderInterval);
    }
  }, [needRefresh, updateServiceWorker]);

  return { needRefresh, updateServiceWorker, checkForUpdates };
};
