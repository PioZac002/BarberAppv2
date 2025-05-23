
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { UserRole } from '@/types/auth';

type UserRole = "client" | "barber" | "admin";

type RequireAuthOptions = {
    redirectTo?: string;
    allowedRoles?: UserRole[];
};

export const useRequireAuth = (options: RequireAuthOptions = {}) => {
    const { isAuthenticated, user, loading } = useAuth();
    const navigate = useNavigate();
    const { redirectTo = '/login', allowedRoles } = options;

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            toast.error('You need to be logged in to access this page');
            navigate(redirectTo);
            return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            toast.error('You do not have permission to access this page');
            navigate('/');
        }
    }, [isAuthenticated, user, loading, navigate, redirectTo, allowedRoles]);

    return { isAuthenticated, user, loading };
};
