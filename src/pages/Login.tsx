import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { toast } from "sonner";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const { login } = useAuth();

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = "Adres e‑mail jest wymagany";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Adres e‑mail jest nieprawidłowy";
        }

        if (!password) {
            newErrors.password = "Hasło jest wymagane";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await login(email, password);
            // toast.success jest w useAuth.tsx
        } catch (error) {
            toast.error("Logowanie nie powiodło się. Sprawdź dane i spróbuj ponownie.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12">
                <div className="w-full max-w-md px-4">
                    <Card className="animate-fade-in">
                        <CardHeader className="space-y-1 text-center">
                            <CardTitle className="text-3xl font-bold text-barber-dark">
                                Witaj ponownie
                            </CardTitle>
                            <CardDescription>
                                Wprowadź adres e‑mail i hasło, aby zalogować się na swoje konto
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">E‑mail</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                            className={errors.email ? "border-red-500" : ""}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-sm">{errors.email}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Hasło</Label>
                                            <Link
                                                to="/forgot-password"
                                                className="text-sm text-barber hover:underline"
                                            >
                                                Zapomniałeś hasła?
                                            </Link>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                            className={errors.password ? "border-red-500" : ""}
                                        />
                                        {errors.password && (
                                            <p className="text-red-500 text-sm">{errors.password}</p>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        className="bg-barber hover:bg-barber-muted btn-hover"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">Lub</span>
                                </div>
                            </div>
                            <div className="text-center text-sm">
                                Nie masz konta?{" "}
                                <Link to="/register" className="text-barber hover:underline">
                                    Zarejestruj się
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default Login;
