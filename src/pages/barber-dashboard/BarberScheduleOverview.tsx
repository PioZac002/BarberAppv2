// src/pages/barber-dashboard/BarberScheduleOverview.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
// useRequireAuth jest już w komponencie nadrzędnym (BarberDashboard.tsx)
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import MuiCalendar from "@/components/ui/mui-calendar";
import {
    User,
    Clock,
    CalendarDays,
    Info,
    Bell,
    Star,
    ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, isValid, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import dayjs from "dayjs";
import "dayjs/locale/pl";

dayjs.locale("pl");

interface DailyAppointment {
    id: number;
    client_name: string;
    service_name: string;
    appointment_time: string;
    status: string;
    price: number | string;
}

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case "new_booking_barber":
        case "appointment_confirmed_by_admin_staff":
        case "appointment_canceled":
            return CalendarDays;
        case "new_review":
            return Star;
        default:
            return Bell;
    }
};

const getNotificationColorClass = (type: string) => {
    switch (type) {
        case "new_booking_barber":
        case "appointment_confirmed_by_admin_staff":
            return "text-blue-500";
        case "appointment_canceled":
            return "text-red-500";
        case "new_review":
            return "text-yellow-500";
        default:
            return "text-gray-500";
    }
};

const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case "pending":
            return "bg-yellow-100 text-yellow-800";
        case "confirmed":
            return "bg-green-100 text-green-800";
        case "completed":
            return "bg-blue-100 text-blue-800";
        case "canceled":
        case "cancelled":
            return "bg-red-100 text-red-800";
        case "no-show":
            return "bg-orange-100 text-orange-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
        case "pending":
            return "Oczekująca";
        case "confirmed":
            return "Potwierdzona";
        case "completed":
            return "Zrealizowana";
        case "canceled":
        case "cancelled":
            return "Anulowana";
        case "no-show":
            return "Nieobecność";
        default:
            return status;
    }
};

const BarberScheduleOverview = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [dailyAppointments, setDailyAppointments] = useState<DailyAppointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const [latestNotifications, setLatestNotifications] = useState<Notification[]>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

    useEffect(() => {
        if (authContextLoading) {
            setIsLoadingAppointments(true);
            setIsLoadingNotifications(true);
            return;
        }
        if (!authUser || !token) {
            setDailyAppointments([]);
            setLatestNotifications([]);
            setIsLoadingAppointments(false);
            setIsLoadingNotifications(false);
            return;
        }

        // Pobierz harmonogram dnia
        if (selectedDate && isValid(selectedDate)) {
            const fetchDailySchedule = async () => {
                if (!token) return;
                setIsLoadingAppointments(true);
                const formattedDate = format(selectedDate, "yyyy-MM-dd");
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/barber/schedule?date=${formattedDate}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (!response.ok) {
                        let errorMsg = "Nie udało się pobrać harmonogramu dnia";
                        try {
                            const errorData = await response.json();
                            errorMsg = errorData.error || errorMsg;
                        } catch (e) {
                            /* Ignore */
                        }
                        throw new Error(errorMsg);
                    }
                    const data = await response.json();
                    setDailyAppointments(data);
                } catch (error: any) {
                    console.error("Error fetching daily schedule:", error);
                    toast.error(error.message || "Nie udało się wczytać harmonogramu dnia");
                    setDailyAppointments([]);
                } finally {
                    setIsLoadingAppointments(false);
                }
            };
            fetchDailySchedule();
        } else {
            setDailyAppointments([]);
            setIsLoadingAppointments(false);
        }

        // Pobierz ostatnie powiadomienia
        const fetchLatestNotifications = async () => {
            if (!token) return;
            setIsLoadingNotifications(true);
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/barber/notifications?limit=5`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!response.ok) {
                    let errorMsg = "Nie udało się pobrać powiadomień";
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) {
                        /* Ignore */
                    }
                    throw new Error(errorMsg);
                }
                const data: Notification[] = await response.json();
                setLatestNotifications(data);
            } catch (error: any) {
                console.error("Error fetching notifications:", error);
                toast.error(error.message || "Nie udało się wczytać powiadomień");
                setLatestNotifications([]);
            } finally {
                setIsLoadingNotifications(false);
            }
        };
        fetchLatestNotifications();
    }, [authUser, token, selectedDate, authContextLoading]);

    const handleDateChangeForMui = (newDate: Date | null) => {
        setSelectedDate(newDate || undefined);
    };

    // Połączony stan ładowania dla całego widoku
    if (
        authContextLoading ||
        (isLoadingAppointments &&
            isLoadingNotifications &&
            dailyAppointments.length === 0 &&
            latestNotifications.length === 0)
    ) {
        // Pokaż loader tylko jeśli oba są w trakcie ładowania *i* nie ma jeszcze żadnych danych
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        // Ten komponent NIE renderuje DashboardLayout
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 items-start">
            <div className="xl:col-span-1 w-full space-y-4 md:space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <CalendarDays className="h-5 w-5 mr-2 text-barber" />
                            Wybierz datę
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Zobacz wizyty dla wybranego dnia.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center p-2 sm:p-4">
                        <MuiCalendar
                            value={selectedDate || null}
                            onChange={handleDateChangeForMui}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <Bell className="h-5 w-5 mr-2 text-barber" />
                            Ostatnie powiadomienia
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Twoje najnowsze powiadomienia.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 px-3 sm:px-4">
                        {isLoadingNotifications && latestNotifications.length === 0 ? (
                            // Pokaż loader tylko jeśli nie ma jeszcze danych
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-barber mx-auto"></div>
                            </div>
                        ) : latestNotifications.length > 0 ? (
                            <div className="space-y-3">
                                {latestNotifications.map((notification) => {
                                    const IconComponent = getNotificationIcon(notification.type);
                                    const timeAgo = isValid(new Date(notification.created_at))
                                        ? formatDistanceToNow(
                                            new Date(notification.created_at),
                                            { addSuffix: true, locale: pl }
                                        )
                                        : "Nieprawidłowa data";
                                    return (
                                        <Link
                                            to="/barber-dashboard/notifications"
                                            key={notification.id}
                                            className={`block p-2.5 rounded-md border transition-colors ${
                                                notification.is_read
                                                    ? "bg-gray-50 hover:bg-gray-100 border-gray-200"
                                                    : "bg-blue-50 hover:bg-blue-100 border-blue-200"
                                            }`}
                                        >
                                            <div className="flex items-center space-x-2.5">
                                                <div
                                                    className={`flex-shrink-0 p-1.5 rounded-full ${
                                                        notification.is_read ? "bg-gray-200" : "bg-white"
                                                    }`}
                                                >
                                                    <IconComponent
                                                        className={`h-4 w-4 ${getNotificationColorClass(
                                                            notification.type
                                                        )}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={`text-xs sm:text-sm font-medium truncate ${
                                                            notification.is_read
                                                                ? "text-gray-700"
                                                                : "text-gray-900"
                                                        }`}
                                                    >
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
                                <Link
                                    to="/barber-dashboard/notifications"
                                    className="block mt-3"
                                >
                                    <Button variant="outline" size="sm" className="w-full">
                                        Zobacz wszystkie powiadomienia
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    Brak nowych powiadomień.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="xl:col-span-2 w-full">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <Clock className="h-5 w-5 mr-2 text-barber" />
                            Wizyty na{" "}
                            {selectedDate && isValid(selectedDate)
                                ? format(selectedDate, "PPP", { locale: pl })
                                : "..."}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Zaplanowane wizyty na wybrany dzień.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAppointments && dailyAppointments.length === 0 ? (
                            // Pokaż loader tylko jeśli nie ma jeszcze danych
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-barber mx-auto mb-2"></div>
                                <p className="text-gray-500 text-sm">Ładowanie wizyt...</p>
                            </div>
                        ) : dailyAppointments.length > 0 ? (
                            <div className="space-y-3 sm:space-y-4">
                                {dailyAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center mb-2 sm:mb-0 w-full sm:w-auto">
                                            <div
                                                className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white ${
                                                    getStatusBadgeVariant(apt.status).split(" ")[0]
                                                }`}
                                            >
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div className="ml-3 min-w-0 flex-1">
                                                <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                                    {apt.client_name}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                    {apt.service_name} &bull;{" "}
                                                    {parseFloat(String(apt.price)).toFixed(2)} PLN
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-1 sm:mt-0">
                                            <p className="font-medium text-gray-700 flex items-center text-xs sm:text-sm whitespace-nowrap">
                                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-500" />
                                                {isValid(new Date(apt.appointment_time))
                                                    ? format(
                                                        new Date(apt.appointment_time),
                                                        "p",
                                                        { locale: pl }
                                                    )
                                                    : "Nieprawidłowa godzina"}
                                            </p>
                                            <Badge
                                                className={`${
                                                    getStatusBadgeVariant(apt.status)
                                                } mt-0 sm:mt-1 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1`}
                                            >
                                                {getStatusLabel(apt.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Info className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-md font-medium text-gray-700 mb-1">
                                    Brak umówionych wizyt na{" "}
                                    {selectedDate && isValid(selectedDate)
                                        ? format(selectedDate, "PPP", { locale: pl })
                                        : "ten dzień"}
                                    .
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Twój grafik jest pusty w tym dniu.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BarberScheduleOverview;
