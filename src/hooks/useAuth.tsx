import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContextType, User } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyTokenOnLoad = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch('http://localhost:3000/api/verify-token', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (response.ok) {
                        const { user } = await response.json();
                        setUser(user);
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem('token');
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Błąd weryfikacji tokenu:', error);
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        verifyTokenOnLoad();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Logowanie nie powiodło się');
            }
            const { token, user } = await response.json();

            localStorage.setItem('token', token);
            setUser(user);
            setIsAuthenticated(true);

            toast.success('Zalogowano pomyślnie!');
            if (user.role === 'admin') navigate('/admin-dashboard');
            else if (user.role === 'barber') navigate('/barber-dashboard');
            else navigate('/user-dashboard');
        } catch (error) {
            toast.error(error.message || 'Logowanie nie powiodło się. Spróbuj ponownie.');
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
    };

    const register = async (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => {
        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Rejestracja nie powiodła się');
            }
            const { user } = await response.json();

            toast.success('Rejestracja zakończona sukcesem! Zaloguj się.');
            navigate('/login');
        } catch (error) {
            toast.error(error.message || 'Rejestracja nie powiodła się. Spróbuj ponownie.');
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};