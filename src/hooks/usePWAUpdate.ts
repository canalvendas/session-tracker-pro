import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const usePWAUpdate = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Verifica por atualizações a cada 60 segundos
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onNeedRefresh() {
      // Chamado quando uma nova versão está disponível
      console.log('Nova versão do PWA disponível');
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast('Nova versão disponível!', {
        action: {
          label: 'Atualizar',
          onClick: () => updateServiceWorker(true),
        },
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return { needRefresh, updateServiceWorker };
};
