import { ReactNode, useState } from "react";
import {
    CalendarIcon,
    HomeIcon,
    UserIcon,
    Star,
    Bell,
    LogOut,
    Scissors,
    BarChart,
    X,
    Sun,
    Moon,
    FlaskConical,
} from "lucide-react";

const DEMO_EMAILS = [
    'admin@barbershop.com',
    'marek@barbershop.com',
    'jan@example.com',
];
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

interface DashboardLayoutProps {
    children: ReactNode;
    title: string;
}

interface SidebarItem {
    icon: typeof HomeIcon;
    label: string;
    href: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
    const { logout, user } = useAuth();
    const { t, lang, toggleLang } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const location = useLocation();

    const getUserSidebarItems = (): SidebarItem[] => {
        if (!user) return [];

        const clientItems: SidebarItem[] = [
            { icon: HomeIcon, label: t('dashboard.overview'), href: "/user-dashboard" },
            { icon: CalendarIcon, label: t('dashboard.appointments'), href: "/user-dashboard/appointments" },
            { icon: UserIcon, label: t('dashboard.profile'), href: "/user-dashboard/profile" },
            { icon: Star, label: t('dashboard.reviews'), href: "/user-dashboard/reviews" },
            { icon: Bell, label: t('dashboard.notifications'), href: "/user-dashboard/notifications" },
        ];

        const barberItems: SidebarItem[] = [
            { icon: HomeIcon, label: t('dashboard.schedule'), href: "/barber-dashboard" },
            { icon: CalendarIcon, label: t('dashboard.appointments'), href: "/barber-dashboard/appointments" },
            { icon: Star, label: t('dashboard.portfolio'), href: "/barber-dashboard/portfolio" },
            { icon: Bell, label: t('dashboard.notifications'), href: "/barber-dashboard/notifications" },
            { icon: UserIcon, label: t('dashboard.profile'), href: "/barber-dashboard/profile" },
        ];

        const adminItems: SidebarItem[] = [
            { icon: HomeIcon, label: t('dashboard.overview'), href: "/admin-dashboard" },
            { icon: UserIcon, label: t('dashboard.users'), href: "/admin-dashboard/users" },
            { icon: CalendarIcon, label: t('dashboard.appointments'), href: "/admin-dashboard/appointments" },
            { icon: Scissors, label: t('dashboard.services'), href: "/admin-dashboard/services" },
            { icon: Star, label: t('dashboard.reviews'), href: "/admin-dashboard/reviews" },
            { icon: Bell, label: t('dashboard.notifications'), href: "/admin-dashboard/notifications" },
            { icon: BarChart, label: t('dashboard.reports'), href: "/admin-dashboard/reports" },
            { icon: UserIcon, label: t('dashboard.profile'), href: "/admin-dashboard/profile" },
        ];

        switch (user.role) {
            case "barber": return barberItems;
            case "admin": return adminItems;
            case "client":
            default: return clientItems;
        }
    };

    const sidebarItems = getUserSidebarItems();
    const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);
    const isDemo = user?.email ? DEMO_EMAILS.includes(user.email.toLowerCase()) : false;

    const isActive = (href: string) =>
        location.pathname === href ||
        (href === "/admin-dashboard" && location.pathname === "/admin-dashboard");

    return (
        <div className="min-h-screen flex flex-col bg-muted/30 dark:bg-background">
            {/* Top Bar */}
            <header className="bg-card dark:bg-card border-b border-border h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
                <div className="flex items-center">
                    <button
                        className="lg:hidden mr-4 text-muted-foreground hover:text-foreground"
                        onClick={toggleMobileSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <Link to="/" className="text-xl font-bold text-barber">
                        BarberShop
                    </Link>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <span className="text-sm text-muted-foreground hidden md:inline-block">
                        {t('dashboard.welcome')}, {user?.firstName || "User"} ({user?.role})
                    </span>
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-barber hover:bg-barber/10 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark"
                            ? <Sun className="h-4 w-4" />
                            : <Moon className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={toggleLang}
                        className="px-2 py-0.5 rounded border border-border text-xs font-bold tracking-wide text-muted-foreground hover:border-barber hover:text-barber transition-colors"
                        aria-label="Toggle language"
                    >
                        {lang === "pl" ? "EN" : "PL"}
                    </button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        className="text-muted-foreground hover:text-barber hover:bg-transparent"
                    >
                        <LogOut className="h-4 w-4 mr-1" />
                        {t('dashboard.logout')}
                    </Button>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Sidebar — Desktop */}
                <aside className="hidden lg:block w-64 border-r border-border bg-card dark:bg-card sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                    <div className="py-6 px-4">
                        <nav className="space-y-1">
                            {sidebarItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
                                        isActive(item.href)
                                            ? "bg-barber text-white"
                                            : "text-foreground hover:bg-barber/10 hover:text-barber"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 mr-3" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Sidebar — Mobile */}
                {isMobileSidebarOpen && (
                    <div className="lg:hidden fixed inset-0 z-40">
                        <div className="absolute inset-0 bg-black/50" onClick={toggleMobileSidebar} />
                        <div className="absolute left-0 top-0 bottom-0 w-64 bg-card dark:bg-card shadow-xl animate-slide-in">
                            <div className="flex justify-between items-center px-4 py-3 border-b border-border">
                                <h3 className="font-semibold text-barber">Menu</h3>
                                <button onClick={toggleMobileSidebar} className="text-muted-foreground hover:text-foreground" aria-label="Close sidebar">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <nav className="py-4 px-2 space-y-1">
                                {sidebarItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
                                            isActive(item.href)
                                                ? "bg-barber text-white"
                                                : "text-foreground hover:bg-barber/10 hover:text-barber"
                                        )}
                                        onClick={toggleMobileSidebar}
                                    >
                                        <item.icon className="h-5 w-5 mr-3" />
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {isDemo && (
                        <div className="mb-6 flex items-start gap-3 rounded-lg border border-barber/40 bg-barber/10 px-4 py-3 text-sm">
                            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-barber" />
                            <div>
                                <span className="font-semibold text-barber">{t('auth.demoBanner')} </span>
                                <span className="text-muted-foreground">{t('auth.demoBannerDesc')}</span>
                            </div>
                        </div>
                    )}
                    <h1 className="text-2xl font-semibold text-foreground mb-6">{title}</h1>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
