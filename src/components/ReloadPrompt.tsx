import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

function ReloadPrompt() {
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

    React.useEffect(() => {
        if (needRefresh) {
            const toastId = toast.info('Nowa wersja aplikacji jest dostępna!', {
                position: 'top-center',
                duration: Infinity, // Czekaj na akcję użytkownika
                action: {
                    label: 'Odśwież',
                    onClick: () => {
                        updateServiceWorker(true);
                        toast.dismiss(toastId);
                    },
                },
                cancel: {
                    label: 'Później',
                    onClick: () => {
                        setNeedRefresh(false);
                        toast.dismiss(toastId);
                    }
                },
            });
        }
    }, [needRefresh, updateServiceWorker, setNeedRefresh]);

    return null; // Komponent nie renderuje nic widocznego, tylko obsługuje toasty
}

export default ReloadPrompt;
