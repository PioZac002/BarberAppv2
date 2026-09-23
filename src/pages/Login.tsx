import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import { Lockup } from "@/components/brand/Szlif";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Most people meet this product here, through the one-click demo logins.
 * So the demo accounts are not a footnote under the form — they are three
 * bottles standing on the shelf, each capped in its own ink.
 */
const DEMO_ACCOUNTS = [
    { key: "demoAdmin" as const,  email: "admin@barbershop.com", password: "Admin1234!", cap: "bg-ink2" },
    { key: "demoBarber" as const, email: "marek@barbershop.com", password: "User1234!",  cap: "bg-primary" },
    { key: "demoClient" as const, email: "jan@example.com",      password: "User1234!",  cap: "bg-chrome" },
] as const;

const Login = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [demoLoading, setDemoLoading] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const { login } = useAuth();

    const handleDemoLogin = async (demoEmail: string, demoPassword: string, key: string) => {
        setDemoLoading(key);
        try {
            await login(demoEmail, demoPassword);
        } catch {
            toast.error(t("auth.loginFailed"));
        } finally {
            setDemoLoading(null);
        }
    };

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email) newErrors.email = t("auth.emailRequired");
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t("auth.emailInvalid");
        if (!password) newErrors.password = t("auth.passwordRequired");
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

    const busy = isSubmitting || demoLoading !== null;

    return (
        <Layout withFooter={false}>
            <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[1.1fr_1fr]">
                {/* the wall, so you know whose counter you are standing at */}
                <div className="tile-wall relative hidden flex-col justify-end p-10 lg:flex xl:p-14">
                    <Lockup className="w-[min(26rem,60%)] text-wall" />
                    <div className="shelf mt-8 w-full" aria-hidden />
                    <p className="mt-6 max-w-sm text-sm leading-relaxed text-wall/80">
                        {t("auth.loginSubtitleFull")}
                    </p>
                </div>

                <div className="flex items-center justify-center bg-background px-5 py-12 md:px-8">
                    <div className="w-full max-w-md">
                        <h2 className="section-head">{t("auth.loginWelcome")}</h2>
                        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground lg:hidden">
                            {t("auth.loginSubtitleFull")}
                        </p>

                        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="directions">{t("auth.email")}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                    aria-invalid={!!errors.email}
                                    aria-describedby={errors.email ? "email-error" : undefined}
                                />
                                {errors.email && (
                                    <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-baseline justify-between gap-3">
                                    <Label htmlFor="password" className="directions">{t("auth.password")}</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-primary underline-offset-4 hover:underline"
                                    >
                                        {t("auth.forgotPassword")}
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? "password-error" : undefined}
                                />
                                {errors.password && (
                                    <p id="password-error" className="text-sm text-destructive">{errors.password}</p>
                                )}
                            </div>

                            <Button type="submit" size="lg" className="w-full" disabled={busy}>
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
                            </Button>
                        </form>

                        {/* ── the demo shelf ── */}
                        <section className="mt-10" aria-labelledby="demo-heading">
                            <div className="rule-double flex items-baseline justify-between gap-3 pb-2">
                                <h3 id="demo-heading" className="label-caps text-[0.8125rem]">
                                    {t("auth.demoTitle")}
                                </h3>
                                <span className="directions">{t("auth.demoSubtitle")}</span>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2.5">
                                {DEMO_ACCOUNTS.map(account => {
                                    const loading = demoLoading === account.key;
                                    return (
                                        <button
                                            key={account.key}
                                            type="button"
                                            disabled={busy}
                                            onClick={() => handleDemoLogin(account.email, account.password, account.key)}
                                            className="plate plate-interactive flex flex-col items-start gap-3 p-3 text-left disabled:pointer-events-none disabled:opacity-50"
                                        >
                                            {/* the bottle's cap: one ink per role */}
                                            <span className={cn("h-1.5 w-8 shrink-0", account.cap)} aria-hidden />
                                            <span className="label-caps text-[0.6875rem] leading-tight">
                                                {t(`auth.${account.key}`)}
                                            </span>
                                            {loading ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                            ) : (
                                                <span className="net-line text-micro text-muted-foreground">
                                                    {account.email.split("@")[0]}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                {t("auth.demoNote")}
                            </p>
                        </section>

                        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
                            {t("auth.noAccount")}{" "}
                            <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                                {t("auth.signUpLink")}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Login;
