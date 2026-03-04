import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
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
    const { t } = useLanguage();
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
        if (!formData.firstName) newErrors.firstName = t("auth.firstNameRequired");
        if (!formData.lastName)  newErrors.lastName  = t("auth.lastNameRequired");
        if (!formData.email) {
            newErrors.email = t("auth.emailRequired");
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t("auth.emailInvalid");
        }
        if (!formData.phone)     newErrors.phone     = t("auth.phoneRequired");
        if (!formData.password) {
            newErrors.password = t("auth.passwordRequired");
        } else if (formData.password.length < 6) {
            newErrors.password = t("auth.passwordMin");
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t("auth.passwordsMismatch");
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
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            await register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
            });
        } catch {
            toast.error(t("auth.registerFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-screen bg-background py-12">
                <div className="w-full max-w-md px-4">
                    <Card className="animate-fade-in shadow-lg border-border">
                        <CardHeader className="space-y-1 text-center pb-6">
                            <div className="w-12 h-12 bg-barber rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-white font-bold text-xl">B</span>
                            </div>
                            <CardTitle className="text-3xl font-bold text-foreground">
                                {t("auth.registerTitle")}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {t("auth.registerSubtitleFull")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                placeholder="Jan"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className={errors.firstName ? "border-destructive" : ""}
                                            />
                                            {errors.firstName && (
                                                <p className="text-destructive text-sm">{errors.firstName}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                placeholder="Kowalski"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className={errors.lastName ? "border-destructive" : ""}
                                            />
                                            {errors.lastName && (
                                                <p className="text-destructive text-sm">{errors.lastName}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t("auth.email")}</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={errors.email ? "border-destructive" : ""}
                                        />
                                        {errors.email && (
                                            <p className="text-destructive text-sm">{errors.email}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{t("auth.phone")}</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+48 123 456 789"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={errors.phone ? "border-destructive" : ""}
                                        />
                                        {errors.phone && (
                                            <p className="text-destructive text-sm">{errors.phone}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">{t("auth.password")}</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={errors.password ? "border-destructive" : ""}
                                        />
                                        {errors.password && (
                                            <p className="text-destructive text-sm">{errors.password}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={errors.confirmPassword ? "border-destructive" : ""}
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-destructive text-sm">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        className="bg-barber hover:bg-barber-muted text-white btn-hover w-full"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? t("auth.creatingAccount") : t("auth.registerButton")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="text-center pt-2">
                            <div className="text-sm text-muted-foreground w-full">
                                {t("auth.hasAccount")}{" "}
                                <Link to="/login" className="text-barber font-medium hover:underline">
                                    {t("auth.signInLink")}
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
