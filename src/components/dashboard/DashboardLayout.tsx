import { ReactNode, useEffect, useState } from "react";
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
    Menu,
    Sun,
    Moon,
    ArrowLeft,
    Pin,
    PinOff,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Mark, MarkWithName } from "@/components/brand/Szlif";

const DEMO_EMAILS = [
    "admin@barbershop.com",
    "marek@barbershop.com",
    "jan@example.com",
];

interface DashboardLayoutProps {
    children: ReactNode;
    title: string;
}

interface SidebarItem {
    icon: typeof HomeIcon;
    label: string;
    href: string;
}

/**
 * The panels invert the register: the glaze keeps the rail, and the work
 * happens on label stock, where dense type and long Polish labels can
 * breathe. Same shop, back room instead of shop floor.
 */
const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
    const { logout, user } = useAuth();
    const { t, lang, toggleLang } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    // The rail rides narrow and opens on approach. Someone who works in it all
    // day can pin it; the choice is theirs and it is remembered.
    const [railPinned, setRailPinned] = useState(false);

    useEffect(() => {
        try { setRailPinned(localStorage.getItem("railPinned") === "1"); } catch { /* storage blocked */ }
    }, []);

    const toggleRailPinned = () => {
        setRailPinned(prev => {
            const next = !prev;
            try { localStorage.setItem("railPinned", next ? "1" : "0"); } catch { /* storage blocked */ }
            return next;
        });
    };
    const location = useLocation();

    useEffect(() => { setIsMobileSidebarOpen(false); }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMobileSidebarOpen]);

    const getUserSidebarItems = (): SidebarItem[] => {
        if (!user) return [];

        const clientItems: SidebarItem[] = [
            { icon: HomeIcon, label: t("dashboard.overview"), href: "/user-dashboard" },
            { icon: CalendarIcon, label: t("dashboard.appointments"), href: "/user-dashboard/appointments" },
            { icon: UserIcon, label: t("dashboard.profile"), href: "/user-dashboard/profile" },
            { icon: Star, label: t("dashboard.reviews"), href: "/user-dashboard/reviews" },
            { icon: Bell, label: t("dashboard.notifications"), href: "/user-dashboard/notifications" },
        ];

        const barberItems: SidebarItem[] = [
            { icon: HomeIcon, label: t("dashboard.schedule"), href: "/barber-dashboard" },
            { icon: CalendarIcon, label: t("dashboard.appointments"), href: "/barber-dashboard/appointments" },
            { icon: Star, label: t("dashboard.portfolio"), href: "/barber-dashboard/portfolio" },
            { icon: Bell, label: t("dashboard.notifications"), href: "/barber-dashboard/notifications" },
            { icon: UserIcon, label: t("dashboard.profile"), href: "/barber-dashboard/profile" },
        ];

        const adminItems: SidebarItem[] = [
            { icon: HomeIcon, label: t("dashboard.overview"), href: "/admin-dashboard" },
            { icon: UserIcon, label: t("dashboard.users"), href: "/admin-dashboard/users" },
            { icon: CalendarIcon, label: t("dashboard.appointments"), href: "/admin-dashboard/appointments" },
            { icon: Scissors, label: t("dashboard.services"), href: "/admin-dashboard/services" },
            { icon: Star, label: t("dashboard.reviews"), href: "/admin-dashboard/reviews" },
            { icon: Bell, label: t("dashboard.notifications"), href: "/admin-dashboard/notifications" },
            { icon: BarChart, label: t("dashboard.reports"), href: "/admin-dashboard/reports" },
            { icon: UserIcon, label: t("dashboard.profile"), href: "/admin-dashboard/profile" },
        ];

        switch (user.role) {
            case "barber": return barberItems;
            case "admin": return adminItems;
            case "client":
            default: return clientItems;
        }
    };

    const sidebarItems = getUserSidebarItems();
    const isDemo = user?.email ? DEMO_EMAILS.includes(user.email.toLowerCase()) : false;
    const isActive = (href: string) => location.pathname === href;

    const roleLabel =
        user?.role === "admin" ? t("dashboard.adminPanel")
        : user?.role === "barber" ? t("dashboard.barberPanel")
        : t("dashboard.clientPanel");

    /* On the collapsible rail the labels are laid out to zero width rather
       than clipped, so nothing is ever half-printed. They stay in the DOM,
       so assistive tech still reads a full menu. */
    const labelCls = (collapsible: boolean) =>
        cn(
            "min-w-0 truncate whitespace-nowrap",
            collapsible &&
                "w-0 opacity-0 transition-[width,opacity] duration-300 ease-out-liquid " +
                "group-hover/rail:w-auto group-hover/rail:opacity-100 " +
                "group-focus-within/rail:w-auto group-focus-within/rail:opacity-100 " +
                "group-data-[pinned]/rail:w-auto group-data-[pinned]/rail:opacity-100"
        );

    const railNav = (onNavigate?: () => void, collapsible = false) => (
        <nav className="flex flex-col gap-0.5" aria-label={roleLabel}>
            {sidebarItems.map(item => {
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        to={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        title={collapsible ? item.label : undefined}
                        className={cn(
                            "label-caps flex items-center gap-3 overflow-hidden rounded-[2px] py-2.5 text-[0.75rem] transition-colors duration-200",
                            collapsible ? "px-[0.9rem]" : "px-3",
                            active
                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className={labelCls(collapsible)}>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    const railFooter = (collapsible = false) => (
        <div className="mt-auto border-t border-sidebar-border/70 pt-4">
            <Link
                to="/"
                title={collapsible ? t("nav.home") : undefined}
                className={cn(
                    "label-caps flex items-center gap-3 overflow-hidden py-2 text-[0.6875rem] text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground",
                    collapsible ? "px-[1.05rem]" : "px-3"
                )}
            >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                <span className={labelCls(collapsible)}>{t("nav.home")}</span>
            </Link>
            <button
                onClick={logout}
                title={collapsible ? t("dashboard.logout") : undefined}
                className={cn(
                    "label-caps flex w-full items-center gap-3 overflow-hidden py-2 text-left text-[0.6875rem] text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground",
                    collapsible ? "px-[1.05rem]" : "px-3"
                )}
            >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className={labelCls(collapsible)}>{t("dashboard.logout")}</span>
            </button>
        </div>
    );

    const chip =
        "inline-flex h-8 min-w-8 items-center justify-center rounded-[2px] border border-border px-2 " +
        "text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

    return (
        <div className={cn("min-h-screen bg-background", railPinned ? "lg:pl-64" : "lg:pl-[4.5rem]")}>
            {/* ── the rail: always the glaze, narrow until approached ──
                It opens on hover and on keyboard focus, and overlays rather
                than reflowing, so the work underneath never jumps. ── */}
            <aside
                data-pinned={railPinned || undefined}
                className={cn(
                    "group/rail fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden",
                    "bg-sidebar py-5 text-sidebar-foreground lg:flex",
                    "w-[4.5rem] px-3 transition-[width,padding] duration-300 ease-out-liquid",
                    "hover:w-64 hover:px-4 hover:shadow-plate-lift",
                    "focus-within:w-64 focus-within:px-4 focus-within:shadow-plate-lift",
                    "data-[pinned]:w-64 data-[pinned]:px-4"
                )}
            >
                <Link to="/" className="flex items-center gap-2.5 overflow-hidden px-[0.55rem]" title="Szlif">
                    <Mark className="h-8 shrink-0" />
                    <span
                        className={cn(
                            "flex flex-col leading-none",
                            "w-0 opacity-0 transition-[width,opacity] duration-300 ease-out-liquid",
                            "group-hover/rail:w-auto group-hover/rail:opacity-100",
                            "group-focus-within/rail:w-auto group-focus-within/rail:opacity-100",
                            "group-data-[pinned]/rail:w-auto group-data-[pinned]/rail:opacity-100"
                        )}
                    >
                        <span className="lockup whitespace-nowrap text-[1.35rem]">Szlif</span>
                        <span className="directions mt-1 whitespace-nowrap text-[0.5625rem] tracking-[0.22em] text-current opacity-70">
                            {roleLabel}
                        </span>
                    </span>
                </Link>

                <div className="my-5 h-px bg-sidebar-border/70" aria-hidden />
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                    {railNav(undefined, true)}
                </div>
                {railFooter(true)}

                {/* keep it open, or let it ride narrow */}
                <button
                    type="button"
                    onClick={toggleRailPinned}
                    aria-pressed={railPinned}
                    title={railPinned ? t("dashboard.unpinRail") : t("dashboard.pinRail")}
                    className="label-caps mt-1 flex items-center gap-3 overflow-hidden rounded-[2px] px-[1.05rem] py-2 text-left text-[0.6875rem] text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
                >
                    {railPinned ? <PinOff className="h-3.5 w-3.5 shrink-0" /> : <Pin className="h-3.5 w-3.5 shrink-0" />}
                    <span className={labelCls(true)}>
                        {railPinned ? t("dashboard.unpinRail") : t("dashboard.pinRail")}
                    </span>
                </button>
            </aside>

            <div className="flex min-h-screen min-w-0 flex-col">
                {/* ── the counter: identity, hour, language ── */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            className={cn(chip, "lg:hidden")}
                            onClick={() => setIsMobileSidebarOpen(true)}
                            aria-label={t("nav.openMenu")}
                            aria-expanded={isMobileSidebarOpen}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <p className="min-w-0 truncate text-sm text-muted-foreground">
                            <span className="text-foreground">{t("dashboard.welcome")}, {user?.firstName || "—"}</span>
                            <span className="directions ml-2.5 hidden sm:inline">{roleLabel}</span>
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
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
                        <button onClick={logout} className={cn(chip, "lg:hidden")} aria-label={t("dashboard.logout")}>
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <main className="min-w-0 flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8">
                    {isDemo && (
                        <div className="plate mb-7 flex items-start gap-3 p-4">
                            <span className="stamp stamp--alert mt-0.5 shrink-0">{t("auth.demoBanner")}</span>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {t("auth.demoBannerDesc")}
                            </p>
                        </div>
                    )}

                    <div className="rule-double mb-7 pb-3">
                        <h1 className="section-head">{title}</h1>
                    </div>

                    {children}
                </main>
            </div>

            {/* ── the rail, pulled out on a phone ── */}
            {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        className="absolute inset-0 bg-ink/70"
                        onClick={() => setIsMobileSidebarOpen(false)}
                        aria-label={t("common.close")}
                    />
                    <div className="absolute inset-y-0 left-0 flex w-[17rem] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground shadow-plate-lift animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between gap-3">
                            <MarkWithName sub subLabel={roleLabel} />
                            <button
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] border border-sidebar-border/80 text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent"
                                aria-label={t("common.close")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="my-5 h-px bg-sidebar-border/70" aria-hidden />
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {railNav(() => setIsMobileSidebarOpen(false))}
                        </div>
                        {railFooter()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
