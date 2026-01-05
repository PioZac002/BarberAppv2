import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { UserRole } from '../../types/auth'; // Poprawny import, na którym będziemy polegać

// Usunięto zduplikowaną, lokalną deklarację:
// type UserRole = "client" | "barber" | "admin";

type RequireAuthOptions = {
    redirectTo?: string;
    allowedRoles?: UserRole[];
};

export const useRequireAuth = (options: RequireAuthOptions = {}) => {
    const { isAuthenticated, user, loading } = useAuth();
    const navigate = useNavigate();
    const { redirectTo = '/login', allowedRoles } = options;

    useEffect(() => {
        if (loading) {
            return; // Nie rób nic, dopóki stan autoryzacji nie jest ustalony
        }

        if (!isAuthenticated) {
            toast.error('Dostęp tylko dla zalogowanych użytkowników');
            navigate(redirectTo);
            return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            toast.error('Nie masz wystarczających uprawnień, aby otworzyć tą stronę');
            navigate('/'); // Przekieruj na stronę główną, jeśli rola się nie zgadza
        }
    }, [isAuthenticated, user, loading, navigate, redirectTo, allowedRoles]);

    return { isAuthenticated, user, loading };
};
