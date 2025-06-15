// src/pages/barber-dashboard/BarberNotificationsPage.tsx
import { useState, useEffect, useMemo } from "react"; // Dodano useMemo
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription, // <-- DODANO IMPORT CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Info,
    CalendarDays, // Użyjemy CalendarDays dla spójności z innymi miejscami
    Users as UsersIcon,
    DollarSign,
    Clock,
    Trash2,
    Link as LinkIconUI
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { formatDistanceToNow, isValid as isValidDateFn } from "date-fns";
import { Link as RouterLink } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminNotificationBackend {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string | null;
    is_read: boolean;
    created_at: string;
    related_appointment_id?: number;
    related_client_id?: number;
    related_barber_id?: number;
}

interface AdminNotificationFE extends AdminNotificationBackend {
    displayType: "info" | "warning" | "success" | "error";
    category: "appointments" | "users" | "system" | "revenue" | "other";
    timestamp: Date;
}

const BarberNotificationsPage = () => { // Zmieniono nazwę komponentu, aby pasowała do nazwy pliku
    const { token, loading: authContextLoading, user: authUser } = useAuth(); // Dodano authUser
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState("all"); // Domyślnie 'all'
    const [notifications, setNotifications] = useState<AdminNotificationFE[]>([]); // Użyjemy AdminNotificationFE dla spójności
    const [isLoading, setIsLoading] = useState(true);

    // Funkcja mapująca typy backendowe na frontendowe (przykładowa, dostosuj do swoich potrzeb)
    const mapBackendNotificationToFrontend = (notif: AdminNotificationBackend): AdminNotificationFE => {
        let displayType: AdminNotificationFE["displayType"] = "info";
        let category: AdminNotificationFE["category"] = "other";

        // Załóżmy, że typy powiadomień barbera są podobne do admina, dostosuj jeśli inne
        switch (notif.type.toLowerCase()) { // Dodano toLowerCase dla pewności
            case "new_booking_barber":
            case "appointment_confirmed_by_admin_staff":
            case "appointment_status_changed_by_barber":
                displayType = "info";
                category = "appointments";
                break;
            case "new_review": // Przykładowy typ dla barbera
                displayType = "success";
                category = "users"; // Lub "system"
                break;
            // Dodaj inne mapowania dla typów powiadomień barbera
            default:
                displayType = "info";
                category = "system";
        }

        return {
            ...notif,
            timestamp: new Date(notif.created_at),
            displayType,
            category,
        };
    };

    useEffect(() => {
        if (authContextLoading) {
            setIsLoading(true);
            return;
        }
        if (!token || !authUser) { // Sprawdź też authUser
            setIsLoading(false);
            setNotifications([]);
            if (!authContextLoading) sonnerToast.error("Błąd autoryzacji. Proszę się zalogować.");
            return;
        }

        const fetchNotifications = async () => {
            if(!token) return;
            setIsLoading(true);
            try {
                // Endpoint dla powiadomień barbera
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Nie udało się pobrać powiadomień barbera" }));
                    throw new Error(errorData.error || "Nie udało się pobrać powiadomień barbera");
                }
                const data: AdminNotificationBackend[] = await response.json(); // Użyj AdminNotificationBackend jako typ danych z API
                setNotifications(data.map(mapBackendNotificationToFrontend));
            } catch (error: any) {
                sonnerToast.error(error.message);
                setNotifications([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, [token, authUser, authContextLoading]); // Dodano authUser do zależności

    const getFilteredNotifications = () => {
        if (activeTab === "all") return notifications;
        if (activeTab === "unread") return notifications.filter(n => !n.is_read);
        // Dla barbera kategorie mogą być inne, na razie uproszczone filtrowanie
        return notifications.filter(n => n.category === activeTab || n.type.toLowerCase().includes(activeTab));
    };

    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    const getNotificationIcon = (type: AdminNotificationFE["displayType"]) => {
        switch (type) {
            case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "error": return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getCategoryIcon = (category: AdminNotificationFE["category"]) => {
        switch (category) {
            case "appointments": return <CalendarDays className="h-4 w-4 text-gray-500" />;
            case "users": return <UsersIcon className="h-4 w-4 text-gray-500" />;
            case "revenue": return <DollarSign className="h-4 w-4 text-gray-500" />; // Raczej nie dla barbera
            default: return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    const markAsRead = async (id: number) => {
        if (!token) { sonnerToast.error("Błąd autoryzacji."); return; }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({error: "Failed to mark as read"}));
                throw new Error(errorData.error || "Błąd podczas oznaczania jako przeczytane.");
            }
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === id
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
        } catch (error: any) {
            sonnerToast.error(error.message || "Błąd podczas oznaczania jako przeczytane.");
        }
    };

    const deleteNotificationFE = async (id: number) => {
        if (!token) { sonnerToast.error("Błąd autoryzacji."); return; }
        if (!window.confirm("Are you sure you want to delete this notification?")) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({error: "Failed to delete"}));
                throw new Error(errorData.error || "Błąd podczas usuwania powiadomienia.");
            }
            setNotifications(prev => prev.filter(n => n.id !== id));
            sonnerToast.success("Powiadomienie usunięte");
        } catch (error: any) {
            sonnerToast.error(error.message || "Błąd podczas usuwania powiadomienia.");
        }
    };

    const markAllAsRead = async () => {
        if (!token || unreadCount === 0) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/notifications/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({error: "Failed to mark all as read"}));
                throw new Error(errorData.error || "Błąd podczas oznaczania wszystkich jako przeczytane.");
            }
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, is_read: true }))
            );
            sonnerToast.success("Wszystkie oznaczono jako przeczytane");
        } catch (error: any) {
            sonnerToast.error(error.message || "Błąd podczas oznaczania wszystkich jako przeczytane.");
        }
    };


    if (authContextLoading || isLoading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    const filteredNotifications = getFilteredNotifications();

    return (
        // Komponent NIE renderuje DashboardLayout
        <div className="space-y-4 md:space-y-6 p-1">
            <Card className="shadow-sm">
                <CardHeader className="border-b pb-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex items-center gap-2">
                            <Bell className="h-6 w-6 text-barber" />
                            <CardTitle className="text-xl md:text-2xl">
                                My Notifications
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">
                                        {unreadCount} NEW
                                    </Badge>
                                )}
                            </CardTitle>
                        </div>
                        {notifications.length > 0 && unreadCount > 0 && (
                            <Button
                                onClick={markAllAsRead}
                                variant="outline"
                                size={isMobile ? "sm" : "default"}
                                className={isMobile ? "w-full mt-2 sm:mt-0" : ""}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark All as Read
                            </Button>
                        )}
                    </div>
                    <CardDescription className="mt-1 text-xs md:text-sm">
                        View and manage your work-related notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                    {/* Uproszczone Taby dla Barbera - można rozbudować, jeśli potrzebne kategorie */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-2'} h-auto sm:h-10 mb-4`}>
                            <TabsTrigger value="all" className={`text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 ${isMobile && activeTab === "all" ? "bg-primary text-primary-foreground" : ""}`}>All</TabsTrigger>
                            <TabsTrigger value="unread" className={`text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 ${isMobile && activeTab === "unread" ? "bg-primary text-primary-foreground" : ""}`}>Unread</TabsTrigger>
                        </TabsList>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {filteredNotifications.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">
                                        {activeTab === "unread" ? "All notifications have been read." : "No notifications in this category."}
                                    </p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${
                                            !notification.is_read ? 'border-l-4 border-barber bg-barber/5' : 'bg-card'
                                        }`}
                                    >
                                        <div className={`flex items-start gap-3 ${isMobile ? "p-2.5" : "p-3"}`}>
                                            <div className={`mt-1 flex flex-col items-center space-y-1 opacity-80 ${isMobile ? "hidden sm:flex" : "flex"}`}>
                                                {getNotificationIcon(notification.displayType)} {/* Użycie displayType */}
                                                {/* Można usunąć getCategoryIcon, jeśli kategorie nie są tu tak istotne */}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 bg-barber rounded-full animate-pulse flex-shrink-0 ml-2" />
                                                    )}
                                                </div>
                                                <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'} mb-1.5 line-clamp-2`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{isValidDateFn(new Date(notification.created_at)) ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : "Invalid date"}</span>
                                                    </div>
                                                    {notification.link && (
                                                        <RouterLink to={notification.link} className="text-primary hover:underline flex items-center gap-1">
                                                            <LinkIconUI className="h-3 w-3" /> Details
                                                        </RouterLink>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5 ml-2">
                                                {!notification.is_read && (
                                                    <Button onClick={() => markAsRead(notification.id)} size="icon" variant="ghost" className={`text-green-600 hover:bg-green-100 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`} title="Mark as read">
                                                        <CheckCircle className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                                    </Button>
                                                )}
                                                <Button onClick={() => deleteNotificationFE(notification.id)} size="icon" variant="ghost" className={`text-destructive hover:bg-destructive/10 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`} title="Delete notification">
                                                    <Trash2 className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default BarberNotificationsPage;