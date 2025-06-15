// types/auth.ts
export type UserRole = 'client' | 'barber' | 'admin';

export interface User {
    id: string | number; // ID może być stringiem lub liczbą, dostosuj do swojej bazy
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    phone?: string; // Backend zwraca phone, więc można go tu dodać, jeśli potrzebny w kontekście
}

export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null; // <-- DODANE POLE TOKEN
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (data: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        password: string
    }) => Promise<void>;
    updateUserContext: (updatedUserData: Partial<User>) => void; // <-- DODANE DLA AKTUALIZACJI PROFILU
}