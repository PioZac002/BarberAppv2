import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import { useRequireAuth } from "@/hooks/useRequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import Calendar from "@/components/ui/calendar";
import {
    User,
    Clock,
    CalendarDays,
    Info,
    Bell, // Ikona dla powiadomień
    Star, // Dla typu 'review' w powiadomieniach
    ArrowRight, // Dla linku "View All"
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Import Button
import { toast } from "sonner";
import { format, isValid, formatDistanceToNow } from "date-fns"; // Dodano formatDistanceToNow

// Interfejsy
interface DailyAppointment {
    id: number;
    client_name: string;
    service_name: string;
    appointment_time: string;
    status: string;
    price: number | string;
}

interface Notification { // Skopiowane z BarberNotifications.tsx dla spójności
    id: number;
    type: string;
    title: string;
    message: string; // Możemy wyświetlić fragment
    is_read: boolean;
    created_at: string;
}

// Funkcje pomocnicze dla ikon powiadomień (skopiowane i uproszczone)
const getNotificationIcon = (type: string) => {
    switch (type) {
        case "new_appointment":
        case "appointment_canceled":
        case "appointment_confirmed":
            return CalendarDays; // Zmieniono na CalendarDays dla odróżnienia od ikony tytułu
        case "new_review":
            return Star;
        default:
            return Bell;
    }
};

const getNotificationColorClass = (type: string) => {
    switch (type) {
        case "new_appointment": return "text-blue-500";
        case "appointment_canceled": return "text-red-500";
        case "new_review": return "text-yellow-500";
        default: return "text-gray-500";
    }
};


const BarberDashboard = () => {
    const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ["barber", "admin"] });
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [dailyAppointments, setDailyAppointments] = useState<DailyAppointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [latestNotifications, setLatestNotifications] = useState<Notification[]>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

    // Efekt do pobierania wizyt dziennych
    useEffect(() => {
        if (!user || !selectedDate || !isValid(selectedDate)) {
            setDailyAppointments([]);
            return;
        }

        const fetchDailySchedule = async () => {
            setIsLoadingAppointments(true);
            const formattedDate = format(selectedDate, "yyyy-MM-dd");
            try {
                const response = await fetch(`http://localhost:3000/api/barber/schedule?date=${formattedDate}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (!response.ok) {
                    let errorMsg = "Failed to fetch daily schedule";
                    try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /* Ignore */ }
                    throw new Error(errorMsg);
                }
                const data = await response.json();
                setDailyAppointments(data);
            } catch (error: any) {
                console.error("Error fetching daily schedule:", error);
                toast.error(error.message || "Failed to load daily schedule");
                setDailyAppointments([]);
            } finally {
                setIsLoadingAppointments(false);
            }
        };

        fetchDailySchedule();
    }, [user, selectedDate]);

    // Efekt do pobierania ostatnich powiadomień
    useEffect(() => {
        if (!user) return;

        const fetchLatestNotifications = async () => {
            setIsLoadingNotifications(true);
            try {
                const response = await fetch("http://localhost:3000/api/barber/notifications", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (!response.ok) {
                    let errorMsg = "Failed to fetch notifications";
                    try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /* Ignore */ }
                    throw new Error(errorMsg);
                }
                const data: Notification[] = await response.json();
                setLatestNotifications(data.slice(0, 5)); // Weź pierwsze 5
            } catch (error: any) {
                console.error("Error fetching notifications:", error);
                toast.error(error.message || "Failed to load notifications");
                setLatestNotifications([]);
            } finally {
                setIsLoadingNotifications(false);
            }
        };
        fetchLatestNotifications();
    }, [user]);


    if (authLoading) {
        return (
            <DashboardLayout title="My Schedule">
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
                </div>
            </DashboardLayout>
        );
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "confirmed": return "bg-green-100 text-green-800";
            case "completed": return "bg-blue-100 text-blue-800";
            case "canceled": return "bg-red-100 text-red-800";
            case "no-show": return "bg-orange-100 text-orange-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <DashboardLayout title="Dashboard Overview">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 items-start">
                {/* Lewa Kolumna: Kalendarz i Powiadomienia */}
                <div className="xl:col-span-1 w-full space-y-4 md:space-y-6">
                    {/* Karta Kalendarza */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg sm:text-xl">
                                <CalendarDays className="h-5 w-5 mr-2 text-barber" />
                                Select Date
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                View appointments for a specific day.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center p-2 sm:p-4">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md border shadow-sm w-auto"
                            />
                        </CardContent>
                    </Card>

                    {/* Karta Ostatnich Powiadomień */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg sm:text-xl">
                                <Bell className="h-5 w-5 mr-2 text-barber" />
                                Recent Notifications
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Your latest 5 notifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 sm:px-4"> {/* Zmniejszony padding górny dla contentu */}
                            {isLoadingNotifications ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-barber mx-auto"></div>
                                </div>
                            ) : latestNotifications.length > 0 ? (
                                <div className="space-y-3">
                                    {latestNotifications.map((notification) => {
                                        const IconComponent = getNotificationIcon(notification.type);
                                        const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
                                        return (
                                            <Link
                                                to="/barber-dashboard/notifications" // Można dodać #notification-id jeśli strona powiadomień to obsłuży
                                                key={notification.id}
                                                className={`block p-2.5 rounded-md border transition-colors ${
                                                    notification.is_read
                                                        ? "bg-gray-50 hover:bg-gray-100 border-gray-200"
                                                        : "bg-blue-50 hover:bg-blue-100 border-blue-200"
                                                }`}>
                                                <div className="flex items-center space-x-2.5">
                                                    <div className={`flex-shrink-0 p-1.5 rounded-full ${notification.is_read ? "bg-gray-200" : "bg-white"}`}>
                                                        <IconComponent className={`h-4 w-4 ${getNotificationColorClass(notification.type)}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs sm:text-sm font-medium truncate ${notification.is_read ? "text-gray-700" : "text-gray-900"}`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{timeAgo}</p>
                                                    </div>
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                    <Link to="/barber-dashboard/notifications" className="block mt-3">
                                        <Button variant="outline" size="sm" className="w-full">
                                            View All Notifications
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No new notifications.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Prawa Kolumna: Wizyty Dziennych */}
                <div className="xl:col-span-2 w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg sm:text-xl">
                                <Clock className="h-5 w-5 mr-2 text-barber" />
                                Appointments for {selectedDate ? format(selectedDate, "PPP") : "..."}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Your scheduled appointments for the selected date.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingAppointments ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-barber mx-auto mb-2"></div>
                                    <p className="text-gray-500 text-sm">Loading appointments...</p>
                                </div>
                            ) : dailyAppointments.length > 0 ? (
                                <div className="space-y-3 sm:space-y-4">
                                    {dailyAppointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center mb-2 sm:mb-0 w-full sm:w-auto">
                                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white ${
                                                    apt.status === 'confirmed' ? 'bg-barber' :
                                                        apt.status === 'pending' ? 'bg-yellow-500' :
                                                            apt.status === 'completed' ? 'bg-blue-500' :
                                                                apt.status === 'canceled' ? 'bg-red-500' :
                                                                    'bg-gray-400'
                                                }`}>
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div className="ml-3 min-w-0 flex-1">
                                                    <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">{apt.client_name}</h4>
                                                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                        {apt.service_name} &bull; ${parseFloat(String(apt.price)).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-1 sm:mt-0">
                                                <p className="font-medium text-gray-700 flex items-center text-xs sm:text-sm whitespace-nowrap">
                                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-500"/>
                                                    {format(new Date(apt.appointment_time), "p")}
                                                </p>
                                                <Badge className={`${getStatusBadgeVariant(apt.status)} mt-0 sm:mt-1 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1`}>
                                                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <Info className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-md font-medium text-gray-700 mb-1">
                                        No appointments scheduled for {selectedDate ? format(selectedDate, "PPP") : "this day"}.
                                    </h3>
                                    <p className="text-sm text-gray-500">Your schedule is clear for this date.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BarberDashboard;