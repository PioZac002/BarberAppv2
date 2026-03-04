// src/pages/user-dashboard/UserDashboard.tsx
import { Routes, Route, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

// Komponenty podstron
import UserProfile from "./UserProfile";
import UserAppointments from "./UserAppointments";
import UserNotifications from "./UserNotifications";
import UserReviews from "./UserReviews";

// Komponent dla Overview - może być nowym plikiem lub zdefiniowany tutaj
import UserOverview from "./UserOverview"; // Załóżmy, że stworzyłeś UserOverview.tsx

const UserDashboard = () => {
    const { user: authUser, loading: authContextLoading } = useAuth();
    useRequireAuth({ allowedRoles: ["client"] });
    const { t } = useLanguage();

    if (authContextLoading) {
        return (
            <DashboardLayout title={t("userPanel.loading")}>
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!authUser && !authContextLoading) {
        return (
            <DashboardLayout title={t("userPanel.authError")}>
                <div className="p-6 text-center">
                    <p className="text-red-500">{t("userPanel.authErrorDesc")}</p>
                    <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                        <Link to="/login">{t("userPanel.goToLogin")}</Link>
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title={t("userPanel.title")}>
            <Routes>
                {/* Trasa bazowa dla /user-dashboard (może to być overview) */}
                <Route path="/" element={<UserOverview />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="appointments" element={<UserAppointments />} />
                <Route path="notifications" element={<UserNotifications />} />
                <Route path="reviews" element={<UserReviews />} />
                {/* Możesz dodać Route path="overview" element={<UserOverview />} jeśli chcesz mieć jawną ścieżkę */}
            </Routes>
        </DashboardLayout>
    );
};

export default UserDashboard;
