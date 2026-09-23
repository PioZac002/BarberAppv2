import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { MarkWithName } from "@/components/brand/Szlif";
import { cn } from "@/lib/utils";

/**
 * The public bar reads as the steriliser cabinet above the back bar:
 * the glaze runs edge to edge, the chrome lip closes it, and the one
 * cream object on it is the label you can act on.
 */
const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const { isAuthenticated, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { lang, toggleLang, t } = useLanguage();

    useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMenuOpen]);

    const getDashboardUrl = () => {
        if (!user) return "/";
        switch (user.role) {
            case "admin":  return "/admin-dashboard";
            case "barber": return "/barber-dashboard";
            default:       return "/user-dashboard";
        }
    };

    const getProfileUrl = () => {
        if (!user) return "/login";
        switch (user.role) {
            case "admin":  return "/admin-dashboard/profile";
            case "barber": return "/barber-dashboard/profile";
            default:       return "/user-dashboard/profile";
        }
    };

    const navLinks = [
        { name: t("nav.home"),     path: "/" },
        { name: t("nav.services"), path: "/services" },
        { name: t("nav.team"),     path: "/team" },
        { name: t("nav.reviews"),  path: "/reviews" },
    ];

    const adminSubMenu = [
        { name: t("adminMenu.overview"),     path: "/admin-dashboard" },
        { name: t("adminMenu.users"),        path: "/admin-dashboard/users" },
        { name: t("adminMenu.appointments"), path: "/admin-dashboard/appointments" },
        { name: t("adminMenu.services"),     path: "/admin-dashboard/services" },
        { name: t("adminMenu.reviews"),      path: "/admin-dashboard/reviews" },
    ];

    /* a chrome chip: the small metal controls screwed to the cabinet */
    const chip =
        "inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-[1px] border " +
        "border-sidebar-border/80 text-sidebar-foreground/90 transition-colors duration-200 " +
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring";

    return (
        <>
            <header className="fixed inset-x-0 top-0 z-50 h-16 bg-sidebar text-sidebar-foreground">
                <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-5 md:px-8">
                    <Link to="/" className="shrink-0 rounded-[1px] text-sidebar-foreground">
                        <MarkWithName />
                        <span className="sr-only">SZLIF</span>
                    </Link>

                    <nav className="hidden flex-1 items-center justify-end gap-6 md:flex">
                        {navLinks.map(link => {
                            const active = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "label-caps relative whitespace-nowrap py-1 text-[0.8125rem] transition-opacity duration-200",
                                        active ? "opacity-100" : "opacity-70 hover:opacity-100"
                                    )}
                                >
                                    {link.name}
                                    {/* where you are, in the page's own ink */}
                                    <span
                                        className={cn(
                                            "absolute -bottom-0.5 left-0 h-[2px] bg-current transition-all duration-300",
                                            active ? "w-full" : "w-0"
                                        )}
                                    />
                                </Link>
                            );
                        })}

                        <span className="h-5 w-px bg-sidebar-border" aria-hidden />

                        <div className="flex items-center gap-1.5">
                            <button onClick={toggleTheme} className={chip} aria-label={t("nav.toggleTheme")}>
                                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={toggleLang}
                                className={cn(chip, "font-mono text-micro font-semibold")}
                                aria-label={t("nav.toggleLanguage")}
                            >
                                {lang === "pl" ? "EN" : "PL"}
                            </button>
                        </div>

                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className={cn(chip, "label-caps gap-1.5 px-3 text-[0.75rem]")}
                                >
                                    {t("nav.account")}
                                    <ChevronDown className="h-3 w-3" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem asChild>
                                        <Link to={getProfileUrl()}>{t("nav.profile")}</Link>
                                    </DropdownMenuItem>
                                    {user?.role === "admin" ? (
                                        <>
                                            <DropdownMenuSeparator />
                                            {adminSubMenu.map(sub => (
                                                <DropdownMenuItem key={sub.path} asChild>
                                                    <Link to={sub.path}>{sub.name}</Link>
                                                </DropdownMenuItem>
                                            ))}
                                        </>
                                    ) : (
                                        <DropdownMenuItem asChild>
                                            <Link to={getDashboardUrl()}>{t("nav.dashboard")}</Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                        {t("nav.logout")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link
                                to="/login"
                                className="label-caps whitespace-nowrap py-1 text-[0.8125rem] opacity-70 transition-opacity duration-200 hover:opacity-100"
                            >
                                {t("nav.login")}
                            </Link>
                        )}

                        {/* booking stays reachable from every page, but the loud
                            object is the jar on the shelf, not a sticky bar CTA */}
                        <Link
                            to="/booking"
                            className="label-caps relative whitespace-nowrap py-1 text-[0.8125rem]"
                        >
                            {t("nav.bookAppointment")}
                            <span className="absolute -bottom-0.5 left-0 h-[2px] w-full bg-ink2" aria-hidden />
                        </Link>
                    </nav>

                    <div className="flex shrink-0 items-center gap-1.5 md:hidden">
                        <button onClick={toggleTheme} className={chip} aria-label={t("nav.toggleTheme")}>
                            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={toggleLang}
                            className={cn(chip, "font-mono text-micro font-semibold")}
                            aria-label={t("nav.toggleLanguage")}
                        >
                            {lang === "pl" ? "EN" : "PL"}
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className={chip}
                            aria-label={t("nav.openMenu")}
                            aria-expanded={isMenuOpen}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <div className="shelf absolute inset-x-0 bottom-0" aria-hidden />
            </header>

            {/* Mobile: the whole wall swings open */}
            {isMenuOpen && (
                <div className="tile-wall fixed inset-0 z-[60] flex flex-col md:hidden">
                    <div className="flex h-16 shrink-0 items-center justify-between px-5 text-wall">
                        <MarkWithName />
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className={chip}
                            aria-label={t("common.close")}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="shelf shrink-0" aria-hidden />

                    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-8">
                        {navLinks.map((link, i) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                style={{ animationDelay: `${i * 40}ms` }}
                                className={cn(
                                    "lockup plate-enter border-b border-wall/25 py-4 text-[2.25rem] text-wall",
                                    location.pathname === link.path && "text-wall"
                                )}
                            >
                                {link.name}
                                {location.pathname === link.path && (
                                    <span className="ml-3 inline-block h-2 w-2 bg-ink2 align-middle" aria-hidden />
                                )}
                            </Link>
                        ))}

                        <Link
                            to="/booking"
                            onClick={() => setIsMenuOpen(false)}
                            className="label-caps plate plate--wall mt-6 flex items-center justify-between px-5 py-4 text-base"
                        >
                            {t("nav.bookAppointment")}
                            <span className="net-line text-micro text-muted-foreground">24/7</span>
                        </Link>

                        <div className="mt-6 flex flex-col gap-1">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to={getProfileUrl()}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="label-caps py-3 text-sm text-wall/85"
                                    >
                                        {t("nav.profile")}
                                    </Link>
                                    <Link
                                        to={getDashboardUrl()}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="label-caps py-3 text-sm text-wall/85"
                                    >
                                        {t("nav.dashboard")}
                                    </Link>
                                    <button
                                        onClick={() => { logout(); setIsMenuOpen(false); }}
                                        className="label-caps py-3 text-left text-sm text-wall/85"
                                    >
                                        {t("nav.logout")}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="label-caps py-3 text-sm text-wall/85"
                                    >
                                        {t("nav.login")}
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="label-caps py-3 text-sm text-wall/85"
                                    >
                                        {t("nav.register")}
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </>
    );
};

export default Navigation;
