import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import { Lockup } from "@/components/brand/Szlif";
import { Loader2 } from "lucide-react";

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
        <Layout withFooter={false}>
            <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[1.1fr_1fr]">
                <div className="tile-wall relative hidden flex-col justify-end p-10 lg:flex xl:p-14">
                    <Lockup className="w-[min(26rem,60%)] text-wall" />
                    <div className="shelf mt-8 w-full" aria-hidden />
                    <p className="mt-6 max-w-sm text-sm leading-relaxed text-wall/80">
                        {t("auth.registerSubtitleFull")}
                    </p>
                </div>

                <div className="flex items-center justify-center bg-background px-5 py-12 md:px-8">
                    <div className="w-full max-w-md">
                        <h2 className="section-head">{t("auth.registerTitle")}</h2>
                        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground lg:hidden">
                            {t("auth.registerSubtitleFull")}
                        </p>
                        <div className="mt-8">
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="directions" htmlFor="firstName">{t("auth.firstName")}</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                placeholder="Jan"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                aria-invalid={!!errors.firstName}
                                            aria-describedby={errors.firstName ? "firstName-error" : undefined}
                                            />
                                            {errors.firstName && (
                                                <p id="firstName-error" className="text-sm text-destructive">{errors.firstName}</p>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="directions" htmlFor="lastName">{t("auth.lastName")}</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                placeholder="Kowalski"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                aria-invalid={!!errors.lastName}
                                            aria-describedby={errors.lastName ? "lastName-error" : undefined}
                                            />
                                            {errors.lastName && (
                                                <p id="lastName-error" className="text-sm text-destructive">{errors.lastName}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="directions" htmlFor="email">{t("auth.email")}</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            aria-invalid={!!errors.email}
                                            aria-describedby={errors.email ? "email-error" : undefined}
                                        />
                                        {errors.email && (
                                            <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="directions" htmlFor="phone">{t("auth.phone")}</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+48 123 456 789"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            aria-invalid={!!errors.phone}
                                            aria-describedby={errors.phone ? "phone-error" : undefined}
                                        />
                                        {errors.phone && (
                                            <p id="phone-error" className="text-sm text-destructive">{errors.phone}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="directions" htmlFor="password">{t("auth.password")}</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            aria-invalid={!!errors.password}
                                            aria-describedby={errors.password ? "password-error" : undefined}
                                        />
                                        {errors.password && (
                                            <p id="password-error" className="text-sm text-destructive">{errors.password}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="directions" htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            aria-invalid={!!errors.confirmPassword}
                                            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                                        />
                                        {errors.confirmPassword && (
                                            <p id="confirmPassword-error" className="text-sm text-destructive">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {isSubmitting ? t("auth.creatingAccount") : t("auth.registerButton")}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
                            {t("auth.hasAccount")}{" "}
                            <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                                {t("auth.signInLink")}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Register;
