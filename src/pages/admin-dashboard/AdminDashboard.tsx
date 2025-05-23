import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Overview from "./AdminOverview";
import Users from "./AdminUsers";
import Appointments from "./AdminAppointments";
import Services from "./AdminServices";
import AdminReviews from "./AdminReviews";

const AdminDashboard = () => {
    const { loading } = useRequireAuth({ allowedRoles: ["admin"] });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        <DashboardLayout title="Admin Dashboard">
            <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="users" element={<Users />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="services" element={<Services />} />
                <Route path="reviews" element={<AdminReviews />} />
            </Routes>
        </DashboardLayout>
    );
};

export default AdminDashboard;