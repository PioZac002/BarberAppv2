// src/pages/barber-dashboard/BarberDashboard.tsx
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout"; // Główny layout
import { Button } from "@/components/ui/button";

// Importuj komponenty podstron dla BarberDashboard
import BarberScheduleOverview from "./BarberScheduleOverview";
import BarberAppointmentsPage from "./BarberAppointments";
import BarberPortfolioPage from "./BarberPortfolio";
import BarberNotificationsPage from "./BarberNotifications";
import BarberProfilePage from "./BarberProfile";

const BarberDashboard = () => {
    const { user: authUser, loading: authContextLoading } = useAuth();
    useRequireAuth({ allowedRoles: ["barber", "admin"] });
    const location = useLocation();

    if (authContextLoading) {
        return (
            <DashboardLayout title="Loading Barber Dashboard...">
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
                </div>
            </DashboardLayout>
        );
    }
    if (!authUser && !authContextLoading) {
        return (
            <DashboardLayout title="Authentication Error">
                <div className="p-6 text-center">
                    <p className="text-red-500">Authentication error. Please log in to continue.</p>
                    <Button asChild className="mt-4 bg-barber hover:bg-barber-muted"><Link to="/login">Go to Login</Link></Button>
                </div>
            </DashboardLayout>
        );
    }

    const getTitle = () => {
        const path = location.pathname.replace("/barber-dashboard", "");
        if (path === "/appointments" || path.startsWith("/appointments/")) return "My Appointments";
        if (path === "/portfolio" || path.startsWith("/portfolio/")) return "My Portfolio";
        if (path === "/notifications" || path.startsWith("/notifications/")) return "Notifications";
        if (path === "/profile" || path.startsWith("/profile/")) return "My Profile";
        if (path === "/" || path === "" || path === "/schedule" || path.startsWith("/schedule/")) return "Schedule Overview";
        return "Barber Dashboard";
    };

    return (
        <DashboardLayout title={getTitle()}> {/* DashboardLayout renderowany jest TYLKO TUTAJ */}
            <Routes>
                <Route path="/" element={<BarberScheduleOverview />} />
                <Route path="schedule" element={<BarberScheduleOverview />} />
                <Route path="appointments" element={<BarberAppointmentsPage />} />
                <Route path="portfolio" element={<BarberPortfolioPage />} />
                <Route path="notifications" element={<BarberNotificationsPage />} />
                <Route path="profile" element={<BarberProfilePage />} />
            </Routes>
        </DashboardLayout>
    );
};

export default BarberDashboard;