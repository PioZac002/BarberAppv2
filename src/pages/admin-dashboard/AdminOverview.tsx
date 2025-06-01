import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Dodajemy Link
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription // Dodajemy CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Dodajemy Button
import {
    Users,
    Calendar,
    Scissors,
    DollarSign,
    TrendingUp,
    Bell, // Zmieniamy Clock na Bell dla powiadomień
    ArrowRight, // Ikona dla linku "View All"
    Info // Ikona dla braku powiadomień
} from "lucide-react";
import { toast } from "sonner"; // Dodajemy toast
import { formatDistanceToNow, isValid as isValidDate } from "date-fns"; // Dodajemy date-fns

interface StatsData {
    users: number;
    activeAppointments: number;
    services: number;
    revenue: number;
}

interface RevenueData {
    month: string;
    amount: number;
}

// Interfejs dla powiadomień admina
interface AdminNotification {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string | null;
    is_read: boolean;
    created_at: string;
    // Dodatkowe pola, jeśli są potrzebne
    related_appointment_id?: number;
    related_client_id?: number;
    related_barber_id?: number;
}

const AdminOverview = () => {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]); // Zmieniono z activities
    const [loading, setLoading] = useState(true);
    const [loadingNotifications, setLoadingNotifications] = useState(true); // Osobne ładowanie dla powiadomień

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setLoadingNotifications(true);
            try {
                const [statsRes, revenueRes, notificationsRes] = await Promise.all([
                    fetch('http://localhost:3000/api/admin/stats', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                    fetch('http://localhost:3000/api/admin/revenue', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                    fetch('http://localhost:3000/api/admin/notifications', { // Nowy endpoint
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                ]);

                if (!statsRes.ok) throw new Error('Failed to fetch stats');
                if (!revenueRes.ok) throw new Error('Failed to fetch revenue');
                if (!notificationsRes.ok) throw new Error('Failed to fetch admin notifications');


                const statsData = await statsRes.json();
                const revenueData = await revenueRes.json();
                const notificationsData = await notificationsRes.json();

                setStats(statsData);
                setRevenue(revenueData);
                setAdminNotifications(notificationsData.slice(0, 5)); // Pokaż ostatnie 5

            } catch (error: any) {
                console.error('Error fetching dashboard data:', error);
                toast.error(error.message || "Failed to load dashboard data.");
            } finally {
                setLoading(false);
                setLoadingNotifications(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) { // Główne ładowanie dla statystyk i przychodów
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    // Funkcja pomocnicza do renderowania ikony na podstawie typu powiadomienia
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_appointment_booked':
            case 'appointment_status_changed':
            case 'appointment_confirmed_by_admin':
            case 'appointment_confirmed_log':
                return <Calendar className="h-5 w-5 text-blue-500" />;
            case 'new_user_registered':
                return <Users className="h-5 w-5 text-green-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };


    return (
        <div>
            {/* Stats Grid (bez zmian) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Users</p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">{stats?.users || 0}</h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                        {/* Można usunąć lub dostosować te wskaźniki procentowe, jeśli nie ma danych */}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Appointments</p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">{stats?.activeAppointments || 0}</h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Services</p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">{stats?.services || 0}</h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <Scissors className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">${stats?.revenue || 0}</h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Data Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart (bez zmian) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2 text-barber" />
                            Revenue Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <div className="h-full w-full flex items-end">
                                {revenue.map((data, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div
                                            className="w-full bg-barber mb-2 rounded-t-sm"
                                            style={{
                                                height: `${Math.min(100, (data.amount / (stats?.revenue || 9000)) * 100)}%`, // Ograniczenie wysokości
                                                maxHeight: "90%"
                                            }}
                                        ></div>
                                        <p className="text-xs text-gray-500">{data.month}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Bell className="h-5 w-5 mr-2 text-barber" />
                            Admin Notifications
                        </CardTitle>
                        <CardDescription>
                            Latest important system events and alerts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingNotifications ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-barber"></div>
                            </div>
                        ) : adminNotifications.length > 0 ? (
                            <div className="space-y-4">
                                {adminNotifications.map((notification) => (
                                    <div key={notification.id} className={`p-3 rounded-md border ${notification.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                                        <div className="flex items-start space-x-3">
                                            <div className={`flex-shrink-0 p-2 rounded-full ${notification.is_read ? "bg-gray-200" : "bg-white shadow-sm"}`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`text-sm font-medium ${notification.is_read ? "text-gray-700" : "text-gray-900"} truncate`}>{notification.title}</h4>
                                                    {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse ml-2"></div>}
                                                </div>
                                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                                                <div className="text-xs text-gray-400 mt-1 flex justify-between items-center">
                                                    <span>{isValidDate(new Date(notification.created_at)) ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : "Invalid date"}</span>
                                                    {notification.link && (
                                                        <Link to={notification.link} className="text-barber hover:underline">
                                                            View
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Link to="/admin-dashboard/notifications" className="block mt-4">
                                    <Button variant="outline" size="sm" className="w-full">
                                        View All Notifications <ArrowRight className="h-4 w-4 ml-2"/>
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Info className="h-10 w-10 text-gray-400 mx-auto mb-3"/>
                                <p className="text-sm text-gray-500">No new admin notifications.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminOverview;