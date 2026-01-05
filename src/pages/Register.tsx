import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

const Register = () => {
    const [formData, setFormData] = useState<FormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();

    const validateForm = () => {
        const newErrors: Partial<FormData> = {};

        if (!formData.firstName) {
            newErrors.firstName = "Imię jest wymagane";
        }

        if (!formData.lastName) {
            newErrors.lastName = "Nazwisko jest wymagane";
        }

        if (!formData.email) {
            newErrors.email = "Adres e‑mail jest wymagany";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Adres e‑mail jest nieprawidłowy";
        }

        if (!formData.phone) {
            newErrors.phone = "Numer telefonu jest wymagany";
        }

        if (!formData.password) {
            newErrors.password = "Hasło jest wymagane";
        } else if (formData.password.length < 6) {
            newErrors.password = "Hasło musi mieć co najmniej 6 znaków";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Hasła nie są zgodne";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
            });
            // toast.success jest w useAuth.tsx
        } catch (error) {
            toast.error("Rejestracja nie powiodła się. Spróbuj ponownie.");
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
                                Utwórz konto
                            </CardTitle>
                            <CardDescription>
                                Wprowadź swoje dane, aby utworzyć nowe konto
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">Imię</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                placeholder="Jan"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className={errors.firstName ? "border-red-500" : ""}
                                            />
                                            {errors.firstName && (
                                                <p className="text-red-500 text-sm">
                                                    {errors.firstName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Nazwisko</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                placeholder="Kowalski"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className={errors.lastName ? "border-red-500" : ""}
                                            />
                                            {errors.lastName && (
                                                <p className="text-red-500 text-sm">
                                                    {errors.lastName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">E‑mail</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={errors.email ? "border-red-500" : ""}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-sm">{errors.email}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Numer telefonu</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+48 123 456 789"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={errors.phone ? "border-red-500" : ""}
                                        />
                                        {errors.phone && (
                                            <p className="text-red-500 text-sm">{errors.phone}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Hasło</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={errors.password ? "border-red-500" : ""}
                                        />
                                        {errors.password && (
                                            <p className="text-red-500 text-sm">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={
                                                errors.confirmPassword ? "border-red-500" : ""
                                            }
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-red-500 text-sm">
                                                {errors.confirmPassword}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        className="bg-barber hover:bg-barber-muted btn-hover"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="text-center">
                            <div className="text-sm">
                                Masz już konto?{" "}
                                <Link to="/login" className="text-barber hover:underline">
                                    Zaloguj się
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default Register;
