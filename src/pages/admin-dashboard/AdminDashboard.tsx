import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import Overview from "./AdminOverview";
import Users from "./AdminUsers";
import Appointments from "./AdminAppointments";
import Services from "./AdminServices";
import AdminReviews from "./AdminReviews";
import AdminReports from "./AdminReports"; // Importujemy nowy komponent
import AdminNotificationsPage from "./AdminNotificationsPage"; // Importujemy nowy komponent dla powiadomień
import AdminProfile from "./AdminProfile";
import { JarLoader } from "@/components/szlif/Loading";

const AdminDashboard = () => {
    const { loading } = useRequireAuth({ allowedRoles: ["admin"] });
    const { t } = useLanguage();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <JarLoader />
            </div>
        );
    }

    return (
        <DashboardLayout title={t('adminPanel.title')}>
            <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="users" element={<Users />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="services" element={<Services />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="reports" element={<AdminReports />} /> {/* Nowa trasa */}
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="profile" element={<AdminProfile />} />
            </Routes>
        </DashboardLayout>
    );
};

export default AdminDashboard;
