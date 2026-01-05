// src/pages/user-dashboard/UserDashboard.tsx
import { Routes, Route, Link } from "react-router-dom"; // Dodano Routes, Route
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";

// Komponenty podstron
import UserProfile from "./UserProfile";
import UserAppointments from "./UserAppointments";
import UserNotifications from "./UserNotifications";
import UserReviews from "./UserReviews";

// Komponent dla Overview - może być nowym plikiem lub zdefiniowany tutaj
import UserOverview from "./UserOverview"; // Załóżmy, że stworzyłeś UserOverview.tsx

const UserDashboard = () => {
    // const { tab } = useParams<{ tab?: string }>(); // Już niepotrzebne w ten sposób
    const { user: authUser, loading: authContextLoading } = useAuth();
    useRequireAuth({ allowedRoles: ["client"] });

    if (authContextLoading) {
        return (
            <DashboardLayout title="Ładowanie panelu...">
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!authUser && !authContextLoading) { // Dodatkowe sprawdzenie
        return (
            <DashboardLayout title="Błąd uwierzytelniania">
                <div className="p-6 text-center">
                    <p className="text-red-500">
                        Błąd uwierzytelniania. Zaloguj się, aby kontynuować.
                    </p>
                    <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                        <Link to="/login">Przejdź do logowania</Link>
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Panel klienta">
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
