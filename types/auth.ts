export type UserRole = 'client' | 'barber' | 'admin';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    phone?: string;
}

export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) => Promise<void>;
}