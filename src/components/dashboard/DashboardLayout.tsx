
import { ReactNode, useState } from "react";
import {
    CalendarIcon,
    HomeIcon,
    UserIcon,
    Star,
    Bell,
    LogOut, Scissors,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

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
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const location = useLocation();

    // Define sidebar items based on user role
    const getUserSidebarItems = () => {
        if (!user) return [];

        const clientItems: SidebarItem[] = [
            { icon: HomeIcon, label: "Overview", href: "/user-dashboard" },
            { icon: CalendarIcon, label: "Appointments", href: "/user-dashboard/appointments" },
            { icon: UserIcon, label: "Profile", href: "/user-dashboard/profile" },
            { icon: Star, label: "Reviews", href: "/user-dashboard/reviews" },
            { icon: Bell, label: "Notifications", href: "/user-dashboard/notifications" },
        ];

        const barberItems: SidebarItem[] = [
            { icon: HomeIcon, label: "Schedule", href: "/barber-dashboard" },
            { icon: CalendarIcon, label: "Appointments", href: "/barber-dashboard/appointments" },
            { icon: Star, label: "Portfolio", href: "/barber-dashboard/portfolio" },
            { icon: Bell, label: "Notifications", href: "/barber-dashboard/notifications" },
            { icon: UserIcon, label: "Profile", href: "/barber-dashboard/profile" },
        ];

        const adminItems: SidebarItem[] = [
            { icon: HomeIcon, label: "Overview", href: "/admin-dashboard" },
            { icon: UserIcon, label: "Users", href: "/admin-dashboard/users" },
            { icon: CalendarIcon, label: "Appointments", href: "/admin-dashboard/appointments" },
            { icon: Scissors, label: "Services", href: "/admin-dashboard/services" },
            { icon: Bell, label: "Staff", href: "/admin-dashboard/staff" },
            { icon: Bell, label: "Reports", href: "/admin-dashboard/reports" },
            { icon: Bell, label: "Settings", href: "/admin-dashboard/settings" },
            { icon: Star, label: "Reviews", href: "/admin-dashboard/reviews" }
        ];

        switch (user.role) {
            case "barber":
                return barberItems;
            case "admin":
                return adminItems;
            case "client":
            default:
                return clientItems;
        }
    };

    const sidebarItems = getUserSidebarItems();

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center">
                    <button
                        className="lg:hidden mr-4 text-gray-500"
                        onClick={toggleMobileSidebar}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                    <Link to="/" className="text-xl font-bold text-barber">
                        BarberShop
                    </Link>
                </div>
                <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 hidden md:inline-block">
            Welcome, {user?.firstName || "User"}
          </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        className="text-gray-500 hover:text-barber hover:bg-transparent"
                    >
                        <LogOut className="h-4 w-4 mr-1" /> Logout
                    </Button>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Sidebar - Desktop */}
                <aside className="hidden lg:block w-64 border-r border-gray-200 bg-white">
                    <div className="py-6 px-4">
                        <nav className="space-y-1">
                            {sidebarItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
                                        location.pathname === item.href
                                            ? "bg-barber text-white"
                                            : "text-gray-700 hover:bg-barber/10"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 mr-3" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Sidebar - Mobile */}
                {isMobileSidebarOpen && (
                    <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
                        <div className="absolute left-0 top-0 bottom-0 w-64 bg-white">
                            <div className="flex justify-between items-center px-4 py-3 border-b">
                                <h3 className="font-semibold text-barber">Menu</h3>
                                <button
                                    onClick={toggleMobileSidebar}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <nav className="py-4 px-2 space-y-1">
                                {sidebarItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
                                            location.pathname === item.href
                                                ? "bg-barber text-white"
                                                : "text-gray-700 hover:bg-barber/10"
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
                <div className="flex-1">
                    <div className="py-6 px-4 sm:px-6 lg:px-8">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h1>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
