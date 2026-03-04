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
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import { toast } from "sonner";

const Login = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const { login } = useAuth();

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email) {
            newErrors.email = t("auth.emailRequired");
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = t("auth.emailInvalid");
        }
        if (!password) {
            newErrors.password = t("auth.passwordRequired");
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch {
            toast.error(t("auth.loginFailed"));
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
                                {t("auth.loginWelcome")}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {t("auth.loginSubtitleFull")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t("auth.email")}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                            className={errors.email ? "border-destructive" : ""}
                                        />
                                        {errors.email && (
                                            <p className="text-destructive text-sm">{errors.email}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">{t("auth.password")}</Label>
                                            <Link
                                                to="/forgot-password"
                                                className="text-sm text-barber hover:text-barber-muted hover:underline transition-colors"
                                            >
                                                {t("auth.forgotPassword")}
                                            </Link>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                            className={errors.password ? "border-destructive" : ""}
                                        />
                                        {errors.password && (
                                            <p className="text-destructive text-sm">{errors.password}</p>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        className="bg-barber hover:bg-barber-muted text-white btn-hover w-full"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-2">
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">
                                        {t("auth.or")}
                                    </span>
                                </div>
                            </div>
                            <div className="text-center text-sm text-muted-foreground">
                                {t("auth.noAccount")}{" "}
                                <Link to="/register" className="text-barber font-medium hover:underline">
                                    {t("auth.signUpLink")}
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
