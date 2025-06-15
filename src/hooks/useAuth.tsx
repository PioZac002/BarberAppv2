// hooks/useAuth.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Dodano useLocation
import { toast } from 'sonner';
import { AuthContextType, User } from '../../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token')); // Inicjalizacja tokenu z localStorage
    const [loading, setLoading] = useState(true); // Główne ładowanie stanu autoryzacji
    const navigate = useNavigate();
    const location = useLocation(); // Aby przekierować po zalogowaniu

    // Funkcja do aktualizacji danych użytkownika w kontekście (np. po edycji profilu)
    const updateUserContext = useCallback((updatedUserData: Partial<User>) => {
        setUser(prevUser => {
            if (prevUser) {
                const newUser = { ...prevUser, ...updatedUserData };
                // Można rozważyć aktualizację localStorage, jeśli przechowujesz tam cały obiekt usera
                // localStorage.setItem('user', JSON.stringify(newUser)); // Opcjonalne
                return newUser;
            }
            return null;
        });
    }, []);

    useEffect(() => {
        const verifyTokenOnLoad = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                // Ustaw token w stanie, nawet przed weryfikacją, aby komponenty miały do niego dostęp
                // Jeśli weryfikacja się nie powiedzie, zostanie usunięty
                setToken(storedToken);
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-token`, {
                        headers: { Authorization: `Bearer ${storedToken}` },
                    });
                    if (response.ok) {
                        const { user: userData } = await response.json();
                        setUser(userData);
                        setIsAuthenticated(true);
                        // Token już jest ustawiony, nie trzeba go ponownie ustawiać
                    } else {
                        localStorage.removeItem('token');
                        setIsAuthenticated(false);
                        setUser(null);
                        setToken(null); // Usuń token ze stanu
                    }
                } catch (error) {
                    console.error('Błąd weryfikacji tokenu przy ładowaniu:', error);
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                    setUser(null);
                    setToken(null); // Usuń token ze stanu
                }
            }
            setLoading(false); // Zakończ główne ładowanie stanu autoryzacji
        };

        verifyTokenOnLoad();
    }, []); // Uruchom tylko raz przy montowaniu komponentu

    const login = async (email: string, password: string) => {
        try {
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
            setToken(apiToken); // Ustaw token w stanie
            setUser(userData);
            setIsAuthenticated(true);

            toast.success('Zalogowano pomyślnie!');

            // Przekierowanie po logowaniu
            const from = (location.state as any)?.from?.pathname || (
                userData.role === 'admin' ? '/admin-dashboard' :
                    userData.role === 'barber' ? '/barber-dashboard' :
                        '/user-dashboard'
            );
            navigate(from, { replace: true });

        } catch (error: any) {
            toast.error(error.message || 'Logowanie nie powiodło się. Spróbuj ponownie.');
            throw error; // Rzuć błąd dalej, aby obsłużyć w formularzu logowania
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null); // Wyczyść token ze stanu
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
        toast.info("Wylogowano pomyślnie.");
    };

    const register = async (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Rejestracja nie powiodła się');
            }
            // Backend nie zwraca tokenu/usera przy rejestracji, tylko wiadomość
            await response.json();

            toast.success('Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.message || 'Rejestracja nie powiodła się. Spróbuj ponownie.');
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, loading, login, logout, register, updateUserContext }}>
            {!loading && children} {/* Renderuj children dopiero po zakończeniu inicjalnego ładowania */}
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