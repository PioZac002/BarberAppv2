import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, ChevronDown, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled]   = useState(false);
    const location = useLocation();

    const { isAuthenticated, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { lang, toggleLang, t } = useLanguage();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when mobile menu is open
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
        { name: t("nav.home"),            path: "/" },
        { name: t("nav.services"),        path: "/services" },
        { name: t("nav.team"),            path: "/team" },
        { name: t("nav.reviews"),         path: "/reviews" },
        { name: t("nav.bookAppointment"), path: "/booking", isButton: true },
    ];

    const adminSubMenu = [
        { name: t("adminMenu.overview"),     path: "/admin-dashboard" },
        { name: t("adminMenu.users"),        path: "/admin-dashboard/users" },
        { name: t("adminMenu.appointments"), path: "/admin-dashboard/appointments" },
        { name: t("adminMenu.services"),     path: "/admin-dashboard/services" },
        { name: t("adminMenu.reviews"),      path: "/admin-dashboard/reviews" },
    ];

    // Fully opaque — no transparency, no blur
    const navBg = theme === "dark"
        ? "bg-[#181816] border-b border-border shadow-sm"
        : "bg-white border-b border-border shadow-sm";

    const linkCls = "text-foreground hover:text-barber";
    const activeCls = "text-barber border-b-2 border-barber";
    const iconCls = "text-foreground hover:text-barber hover:bg-barber/10";
    const langBtnCls = "border-border text-foreground hover:border-barber hover:text-barber";

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
                style={{ height: "64px" }}
            >
                <div className="h-full max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="text-xl font-bold text-barber tracking-tight flex-shrink-0"
                    >
                        BarberShop
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-5 flex-1 justify-end">
                        {navLinks.map(link =>
                            link.isButton ? (
                                <Button
                                    key={link.name}
                                    asChild
                                    size="sm"
                                    className="bg-barber hover:bg-barber-muted text-white btn-hover ml-2"
                                >
                                    <Link to={link.path}>{link.name}</Link>
                                </Button>
                            ) : (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`text-sm font-medium transition-colors pb-0.5 whitespace-nowrap ${linkCls} ${
                                        location.pathname === link.path ? activeCls : ""
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            )
                        )}

                        {/* Divider */}
                        <div className="w-px h-5 bg-border" />

                        {/* Theme + Language toggles */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleTheme}
                                className={`p-1.5 rounded-md transition-colors ${iconCls}`}
                                aria-label="Toggle theme"
                            >
                                {theme === "dark"
                                    ? <Sun className="h-4 w-4" />
                                    : <Moon className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={toggleLang}
                                className={`px-2 py-0.5 rounded border text-xs font-bold tracking-wide transition-colors ${langBtnCls}`}
                                aria-label="Toggle language"
                            >
                                {lang === "pl" ? "EN" : "PL"}
                            </button>
                        </div>

                        {/* Account */}
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`flex items-center gap-1 ${linkCls} hover:bg-barber/10`}
                                    >
                                        <User className="h-4 w-4" />
                                        <span className="text-sm hidden lg:inline">{t("nav.account")}</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
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
                                    <DropdownMenuItem
                                        onClick={logout}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        {t("nav.logout")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className={`text-sm ${linkCls}`}
                                >
                                    <Link to="/login">{t("nav.login")}</Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-barber hover:bg-barber-muted text-white btn-hover"
                                >
                                    <Link to="/register">{t("nav.register")}</Link>
                                </Button>
                            </div>
                        )}
                    </nav>

                    {/* Mobile: toggles + hamburger */}
                    <div className="md:hidden flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={toggleTheme}
                            className={`p-1.5 rounded-md transition-colors ${iconCls}`}
                            aria-label="Toggle theme"
                        >
                            {theme === "dark"
                                ? <Sun className="h-4 w-4" />
                                : <Moon className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={toggleLang}
                            className={`px-2 py-0.5 rounded border text-xs font-bold tracking-wide transition-colors ${langBtnCls}`}
                            aria-label="Toggle language"
                        >
                            {lang === "pl" ? "EN" : "PL"}
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-1.5 rounded-md transition-colors ${iconCls}`}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen
                                ? <X className="h-5 w-5" />
                                : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile menu — full-screen overlay, separate from header so it doesn't affect layout */}
            {isMenuOpen && (
                <div
                    className={`fixed inset-0 z-40 md:hidden flex flex-col ${
                        theme === "dark" ? "bg-[#181816]" : "bg-white"
                    }`}
                >
                    {/* Top bar replicated */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                        <span className="text-xl font-bold text-barber">BarberShop</span>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-1.5 rounded-md text-foreground hover:text-barber hover:bg-barber/10 transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Nav links */}
                    <nav className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-4 py-8 px-6">
                        {navLinks.map(link => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`text-lg font-medium transition-colors w-full text-center py-3 rounded-lg ${
                                    link.isButton
                                        ? "bg-barber text-white hover:bg-barber-muted"
                                        : location.pathname === link.path
                                            ? "text-barber bg-barber/5"
                                            : "text-foreground hover:text-barber hover:bg-barber/5"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="w-full h-px bg-border my-2" />

                        {isAuthenticated ? (
                            <>
                                <Link
                                    to={getProfileUrl()}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-lg text-foreground hover:text-barber transition-colors w-full text-center py-3 rounded-lg hover:bg-barber/5"
                                >
                                    {t("nav.profile")}
                                </Link>
                                {user?.role === "admin" ? (
                                    adminSubMenu.map(sub => (
                                        <Link
                                            key={sub.path}
                                            to={sub.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-base text-muted-foreground hover:text-barber transition-colors w-full text-center py-2"
                                        >
                                            {sub.name}
                                        </Link>
                                    ))
                                ) : (
                                    <Link
                                        to={getDashboardUrl()}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-lg text-foreground hover:text-barber transition-colors w-full text-center py-3 rounded-lg hover:bg-barber/5"
                                    >
                                        {t("nav.dashboard")}
                                    </Link>
                                )}
                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="text-lg text-destructive w-full text-center py-3"
                                >
                                    {t("nav.logout")}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-lg text-foreground hover:text-barber transition-colors w-full text-center py-3 rounded-lg hover:bg-barber/5"
                                >
                                    {t("nav.login")}
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-lg bg-barber text-white hover:bg-barber-muted transition-colors w-full text-center py-3 rounded-lg"
                                >
                                    {t("nav.register")}
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </>
    );
};

export default Navigation;
