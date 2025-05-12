
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type UserRole = "client" | "barber" | "admin";

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse user data", error);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }

        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);

            // This is a mock API call - in a real app, you would call an actual API
            // const response = await fetch('your-api-url/login', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ email, password }),
            // });

            // Demo login logic - replace with real API call in production
            if (email && password) {
                // For demo purposes, create mock user data
                let role: UserRole = "client";

                // Simple demo logic to assign different roles
                if (email.includes("admin")) {
                    role = "admin";
                } else if (email.includes("barber")) {
                    role = "barber";
                }

                const mockUser = {
                    id: Math.random().toString(36).substring(2, 9),
                    email,
                    firstName: "Demo",
                    lastName: "User",
                    role
                };

                const mockToken = Math.random().toString(36).substring(2);

                localStorage.setItem("token", mockToken);
                localStorage.setItem("user", JSON.stringify(mockUser));
                localStorage.setItem("userRole", role);

                setUser(mockUser);

                toast.success("Logged in successfully!");

                // Redirect based on role
                if (role === "admin") {
                    navigate("/admin-dashboard");
                } else if (role === "barber") {
                    navigate("/barber-dashboard");
                } else {
                    navigate("/user-dashboard");
                }
            } else {
                toast.error("Invalid credentials");
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Failed to login. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData: RegisterData) => {
        try {
            setLoading(true);

            // This is a mock API call - in a real app, you would call an actual API
            // const response = await fetch('your-api-url/register', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(userData),
            // });

            // Demo register logic - replace with real API call in production
            if (userData.email && userData.password) {
                const mockUser = {
                    id: Math.random().toString(36).substring(2, 9),
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: "client" as UserRole
                };

                const mockToken = Math.random().toString(36).substring(2);

                localStorage.setItem("token", mockToken);
                localStorage.setItem("user", JSON.stringify(mockUser));
                localStorage.setItem("userRole", "client");

                setUser(mockUser);

                toast.success("Registered successfully!");
                navigate("/user-dashboard");
            } else {
                toast.error("Registration failed");
            }
        } catch (error) {
            console.error("Registration error:", error);
            toast.error("Failed to register. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
        setUser(null);
        toast.success("Logged out successfully!");
        navigate("/");
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
