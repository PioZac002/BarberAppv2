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
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    const { isAuthenticated, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { lang, toggleLang, t } = useLanguage();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const getDashboardUrl = () => {
        if (!user) return "/";
        switch (user.role) {
            case "admin":   return "/admin-dashboard";
            case "barber":  return "/barber-dashboard";
            case "client":
            default:        return "/user-dashboard";
        }
    };

    const getProfileUrl = () => {
        if (!user) return "/login";
        switch (user.role) {
            case "admin":   return "/admin-dashboard/profile";
            case "barber":  return "/barber-dashboard/profile";
            case "client":
            default:        return "/user-dashboard/profile";
        }
    };

    const navLinks = [
        { name: t('nav.home'),            path: "/" },
        { name: t('nav.services'),        path: "/services" },
        { name: t('nav.team'),            path: "/team" },
        { name: t('nav.reviews'),         path: "/reviews" },
        { name: t('nav.bookAppointment'), path: "/booking", isButton: true },
    ];

    const adminSubMenu = [
        { name: t('adminMenu.overview'),     path: "/admin-dashboard" },
        { name: t('adminMenu.users'),        path: "/admin-dashboard/users" },
        { name: t('adminMenu.appointments'), path: "/admin-dashboard/appointments" },
        { name: t('adminMenu.services'),     path: "/admin-dashboard/services" },
        { name: t('adminMenu.reviews'),      path: "/admin-dashboard/reviews" },
    ];

    // Header background classes depend on theme + scroll
    const headerBg = isScrolled
        ? theme === 'dark'
            ? "bg-barber-dark shadow-md py-2"
            : "bg-white shadow-md py-2"
        : theme === 'dark'
            ? "bg-transparent py-4"
            : "bg-white/90 backdrop-blur-sm py-4";

    const textColor = theme === 'dark' ? "text-white" : "text-barber-dark";
    const linkActiveClass = theme === 'dark' ? "border-b-2 border-barber" : "border-b-2 border-barber text-barber";

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
            <div className="container mx-auto px-4 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="text-2xl font-bold text-barber">
                    BarberShop
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center space-x-6">
                    {navLinks.map((link) =>
                        link.isButton ? (
                            <Button key={link.name} asChild className="bg-barber hover:bg-barber-muted text-white btn-hover">
                                <Link to={link.path}>{link.name}</Link>
                            </Button>
                        ) : (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`${textColor} hover:text-barber transition-colors ${location.pathname === link.path ? linkActiveClass : ""}`}
                            >
                                {link.name}
                            </Link>
                        )
                    )}

                    {/* Theme + Language toggles */}
                    <div className="flex items-center space-x-1">
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-md transition-colors hover:bg-barber/10 ${textColor}`}
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>

                        {/* Language toggle */}
                        <button
                            onClick={toggleLang}
                            className={`px-2 py-1 rounded-md text-xs font-bold transition-colors hover:bg-barber/10 ${textColor}`}
                            aria-label="Toggle language"
                        >
                            {lang === 'pl' ? 'EN' : 'PL'}
                        </button>
                    </div>

                    {/* Account menu */}
                    <div className="flex items-center">
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className={`flex items-center ${textColor} hover:bg-barber/10`}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>{t('nav.account')}</span>
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link to={getProfileUrl()}>{t('nav.profile')}</Link>
                                    </DropdownMenuItem>
                                    {user?.role === "admin" ? (
                                        <>
                                            <DropdownMenuSeparator />
                                            {adminSubMenu.map((sub) => (
                                                <DropdownMenuItem key={sub.path} asChild>
                                                    <Link to={sub.path}>{sub.name}</Link>
                                                </DropdownMenuItem>
                                            ))}
                                        </>
                                    ) : (
                                        <DropdownMenuItem asChild>
                                            <Link to={getDashboardUrl()}>{t('nav.dashboard')}</Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                        {t('nav.logout')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Button asChild variant="ghost" className={`${textColor} hover:bg-barber/10`}>
                                    <Link to="/login">{t('nav.login')}</Link>
                                </Button>
                                <Button asChild className="bg-barber hover:bg-barber-muted text-white btn-hover ml-2">
                                    <Link to="/register">{t('nav.register')}</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </nav>

                {/* Mobile: toggles + hamburger */}
                <div className="md:hidden flex items-center space-x-1">
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-md transition-colors hover:bg-barber/10 ${textColor}`}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={toggleLang}
                        className={`px-2 py-1 rounded-md text-xs font-bold transition-colors hover:bg-barber/10 ${textColor}`}
                        aria-label="Toggle language"
                    >
                        {lang === 'pl' ? 'EN' : 'PL'}
                    </button>
                    <button
                        className={`${textColor} p-1`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu overlay */}
            {isMenuOpen && (
                <div className={`fixed inset-0 z-40 md:hidden animate-fade-in ${theme === 'dark' ? 'bg-black/95' : 'bg-white/98'}`}>
                    <div className="flex flex-col h-full justify-center items-center space-y-6 p-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-xl ${
                                    link.isButton
                                        ? "bg-barber text-white px-6 py-2 rounded-md"
                                        : theme === 'dark' ? "text-white" : "text-barber-dark"
                                } ${location.pathname === link.path ? "text-barber" : ""}`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {isAuthenticated ? (
                            <>
                                <Link
                                    to={getProfileUrl()}
                                    className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-barber-dark'}`}
                                >
                                    {t('nav.profile')}
                                </Link>
                                {user?.role === "admin" ? (
                                    adminSubMenu.map((sub) => (
                                        <Link
                                            key={sub.path}
                                            to={sub.path}
                                            className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-barber-dark'}`}
                                        >
                                            {sub.name}
                                        </Link>
                                    ))
                                ) : (
                                    <Link
                                        to={getDashboardUrl()}
                                        className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-barber-dark'}`}
                                    >
                                        {t('nav.dashboard')}
                                    </Link>
                                )}
                                <button
                                    className="text-xl text-destructive"
                                    onClick={logout}
                                >
                                    {t('nav.logout')}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-barber-dark'}`}
                                >
                                    {t('nav.login')}
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-xl bg-barber text-white px-6 py-2 rounded-md"
                                >
                                    {t('nav.register')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navigation;
