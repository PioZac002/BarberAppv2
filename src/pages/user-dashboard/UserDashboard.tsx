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
            <DashboardLayout title="Loading Dashboard...">
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!authUser && !authContextLoading) { // Dodatkowe sprawdzenie
        return (
            <DashboardLayout title="Authentication Error">
                <div className="p-6 text-center">
                    <p className="text-red-500">Authentication error. Please log in to continue.</p>
                    <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                        <Link to="/login">Go to Login</Link>
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    // Logika renderowania overview może pozostać w osobnym komponencie UserOverview
    // lub być częścią trasy bazowej "/"

    // Tytuł dla DashboardLayout może być dynamiczny w zależności od aktualnej trasy
    // Można to zrobić używając useLocation i dopasowując tytuł

    return (
        <DashboardLayout title="User Dashboard"> {/* Możesz chcieć dynamicznego tytułu */}
            <Routes>
                {/* Trasa bazowa dla /user-dashboard (może to być overview) */}
                <Route path="/" element={<UserOverview />} /> {/* Lub bezpośrednio renderOverviewContent() jeśli jest proste */}
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