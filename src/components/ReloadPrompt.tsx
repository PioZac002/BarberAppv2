import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

function ReloadPrompt() {
    const { t } = useLanguage();
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('Service Worker registered:', r);
        },
        onRegisterError(error) {
            console.log('Service Worker registration error:', error);
        },
    });

    const close = () => {
        setNeedRefresh(false);
    };

    React.useEffect(() => {
        if (needRefresh) {
            const toastId = toast.info(t('app.updateAvailable'), {
                position: 'top-center',
                duration: Infinity,
                action: {
                    label: t('app.reload'),
                    onClick: () => {
                        updateServiceWorker(true);
                        toast.dismiss(toastId);
                    },
                },
                cancel: {
                    label: t('app.later'),
                    onClick: () => {
                        close();
                        toast.dismiss(toastId);
                    }
                },
            });
        }
    }, [needRefresh, updateServiceWorker, setNeedRefresh]);

    return null;
}

export default ReloadPrompt;
