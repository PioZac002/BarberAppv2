// src/hooks/useAuth.tsx

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContextType, User } from '../../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);




export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // ... reszta Twoich funkcji (updateUserContext, useEffect) bez zmian ...
    const updateUserContext = useCallback((updatedUserData: Partial<User>) => {
        setUser(prevUser => {
            if (prevUser) {
                const newUser = { ...prevUser, ...updatedUserData };
                return newUser;
            }
            return null;
        });
    }, []);

    useEffect(() => {
        const verifyTokenOnLoad = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                setToken(storedToken);
                try {
                    // ZMIANA TUTAJ
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-token`, {
                        headers: { Authorization: `Bearer ${storedToken}` },
                    });
                    if (response.ok) {
                        const { user: userData } = await response.json();
                        setUser(userData);
                        setIsAuthenticated(true);
                    } else {
                        // Jeśli token jest nieważny, wyczyść stan
                        localStorage.removeItem('token');
                        setIsAuthenticated(false);
                        setUser(null);
                        setToken(null);
                    }
                } catch (error) {
                    console.error('Token verification error:', error);
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                    setUser(null);
                    setToken(null);
                }
            }
            setLoading(false);
        };
        verifyTokenOnLoad();
    }, []);


    const login = async (email: string, password: string) => {
        try {
            // ZMIANA TUTAJ
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Logowanie nie powiodło się');
            }
            const { token: apiToken, user: userData } = await response.json();

            localStorage.setItem('token', apiToken);
            setToken(apiToken);
            setUser(userData);
            setIsAuthenticated(true);
            toast.success('Zalogowano pomyślnie!');

            const from = (location.state as any)?.from?.pathname || (
                userData.role === 'admin' ? '/admin-dashboard' :
                    userData.role === 'barber' ? '/barber-dashboard' :
                        '/user-dashboard'
            );
            navigate(from, { replace: true });

        } catch (error: any) {
            toast.error(error.message || 'Logowanie nie powiodło się. Spróbuj ponownie.');
            throw error;
        }
    };

    const register = async (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => {
        try {
            // ZMIANA TUTAJ
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Rejestracja nie powiodła się');
            }
            await response.json();
            toast.success('Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.message || 'Rejestracja nie powiodła się. Spróbuj ponownie.');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
        toast.info("Wylogowano pomyślnie.");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, loading, login, logout, register, updateUserContext }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
