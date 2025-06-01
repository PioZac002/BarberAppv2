import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth"; // Zmieniono z useRequireAuth na useAuth
// Usunięto: import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription // Dodano CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Info,
    Calendar,
    Users as UsersIcon, // Zmieniono alias dla Users
    DollarSign,
    Clock,
    Trash2,
    Link as LinkIcon // Dodano LinkIcon
} from "lucide-react";
import { toast } from "sonner"; // Zmieniono import dla sonner
import { formatDistanceToNow, isValid as isValidDateFn } from "date-fns"; // Dodano isValid
import { Link as RouterLink } from "react-router-dom"; // Alias dla Link z react-router-dom
import { useIsMobile } from "@/hooks/use-mobile";


interface AdminNotificationBackend { // Interfejs danych z backendu
    id: number; // Zmieniono na number, jeśli ID z bazy jest numeryczne
    type: string; // Typ z backendu (np. 'new_appointment_booked', 'appointment_status_changed')
    title: string;
    message: string;
    link?: string | null;
    is_read: boolean;
    created_at: string; // Data jako string ISO
    related_appointment_id?: number;
    related_client_id?: number;
    related_barber_id?: number;
}

interface AdminNotificationFE extends AdminNotificationBackend { // Rozszerzony interfejs dla frontendu
    displayType: "info" | "warning" | "success" | "error"; // Typ do wyświetlania ikony/koloru
    category: "appointments" | "users" | "system" | "revenue" | "other"; // Kategoria do filtrowania
    timestamp: Date; // Przekonwertowana data
}


const AdminNotificationsPage = () => {
    const { token, loading: authLoading } = useAuth();
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState("all");
    const [notifications, setNotifications] = useState<AdminNotificationFE[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const mapBackendNotificationToFrontend = (notif: AdminNotificationBackend): AdminNotificationFE => {
        let displayType: AdminNotificationFE["displayType"] = "info";
        let category: AdminNotificationFE["category"] = "other";

        // Mapowanie typów z backendu na displayType i category
        // To jest przykładowe mapowanie, dostosuj do swoich typów z backendu
        switch (notif.type) {
            case "new_appointment_booked":
            case "appointment_status_changed":
            case "appointment_confirmed_by_admin":
            case "appointment_confirmed_log":
            case "appointment_confirmed_by_admin_staff": // Dodany typ
            case "appointment_status_changed_by_barber": // Dodany typ
                displayType = "info";
                category = "appointments";
                break;
            case "new_user_registered":
                displayType = "success";
                category = "users";
                break;
            case "low_barber_availability": // Przykładowy nowy typ
                displayType = "warning";
                category = "system"; // Lub "appointments"
                break;
            case "payment_error": // Przykładowy nowy typ
                displayType = "error";
                category = "system";
                break;
            case "high_revenue_day": // Przykładowy nowy typ
                displayType = "success";
                category = "revenue";
                break;
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
        if (authLoading) {
            setIsLoading(true);
            return;
        }
        if (!token) {
            setIsLoading(false);
            setNotifications([]);
            toast.error("Błąd autoryzacji. Proszę się zalogować.");
            return;
        }

        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("http://localhost:3000/api/admin/notifications", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Nie udało się pobrać powiadomień" }));
                    throw new Error(errorData.error || "Nie udało się pobrać powiadomień");
                }
                const data: AdminNotificationBackend[] = await response.json();
                setNotifications(data.map(mapBackendNotificationToFrontend));
            } catch (error: any) {
                toast.error(error.message);
                setNotifications([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, [token, authLoading]);

    const getFilteredNotifications = () => {
        if (activeTab === "all") return notifications;
        if (activeTab === "unread") return notifications.filter(n => !n.is_read);
        return notifications.filter(n => n.category === activeTab);
    };

    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    const getNotificationIcon = (type: AdminNotificationFE["displayType"]) => {
        // ... (bez zmian z Twojego kodu)
        switch (type) {
            case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />; // Zwiększono rozmiar
            case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "error": return <AlertTriangle className="h-5 w-5 text-red-500" />; // Można użyć XCircleIcon
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getCategoryIcon = (category: AdminNotificationFE["category"]) => {
        // ... (bez zmian z Twojego kodu)
        switch (category) {
            case "appointments": return <Calendar className="h-4 w-4 text-gray-500" />;
            case "users": return <UsersIcon className="h-4 w-4 text-gray-500" />;
            case "revenue": return <DollarSign className="h-4 w-4 text-gray-500" />;
            default: return <Bell className="h-4 w-4 text-gray-500" />; // Bell dla system/other
        }
    };

    const markAsRead = async (id: number) => { // Zmieniono id na number
        if (!token) { toast.error("Błąd autoryzacji."); return; }
        try {
            // TODO: Implement backend call: PUT /api/admin/notifications/:id/read
            // const response = await fetch(`http://localhost:3000/api/admin/notifications/${id}/read`, {
            //     method: 'PUT',
            //     headers: { Authorization: `Bearer ${token}` },
            // });
            // if (!response.ok) throw new Error("Failed to mark as read");

            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === id
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
            toast.success("Oznaczono jako przeczytane"); // Użycie sonner
        } catch (error: any) {
            toast.error(error.message || "Błąd podczas oznaczania jako przeczytane.");
        }
    };

    const deleteNotificationFE = async (id: number) => { // Zmieniono id na number, nazwę funkcji
        if (!token) { toast.error("Błąd autoryzacji."); return; }
        try {
            // TODO: Implement backend call: DELETE /api/admin/notifications/:id
            // const response = await fetch(`http://localhost:3000/api/admin/notifications/${id}`, {
            //     method: 'DELETE',
            //     headers: { Authorization: `Bearer ${token}` },
            // });
            // if (!response.ok) throw new Error("Failed to delete notification");

            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success("Powiadomienie usunięte");
        } catch (error: any) {
            toast.error(error.message || "Błąd podczas usuwania powiadomienia.");
        }
    };

    const markAllAsRead = async () => {
        if (!token) { toast.error("Błąd autoryzacji."); return; }
        try {
            // TODO: Implement backend call: PUT /api/admin/notifications/read-all
            // const response = await fetch(`http://localhost:3000/api/admin/notifications/read-all`, {
            //     method: 'PUT',
            //     headers: { Authorization: `Bearer ${token}` },
            // });
            // if (!response.ok) throw new Error("Failed to mark all as read");

            setNotifications(prev =>
                prev.map(notification => ({ ...notification, is_read: true }))
            );
            toast.success("Wszystkie oznaczono jako przeczytane");
        } catch (error: any) {
            toast.error(error.message || "Błąd podczas oznaczania wszystkich jako przeczytane.");
        }
    };

    if (authLoading || isLoading) { // Sprawdzamy oba stany ładowania
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    const filteredNotifications = getFilteredNotifications();

    return (
        // Usunięto DashboardLayout stąd
        <div className="space-y-4 md:space-y-6 p-1">
            <Card className="shadow-sm">
                <CardHeader className="border-b pb-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex items-center gap-2">
                            <Bell className="h-6 w-6 text-barber" />
                            <CardTitle className="text-xl md:text-2xl">
                                Powiadomienia Administratora
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">
                                        {unreadCount} NOWYCH
                                    </Badge>
                                )}
                            </CardTitle>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                onClick={markAllAsRead}
                                variant="outline"
                                size={isMobile ? "sm" : "default"}
                                className={isMobile ? "w-full mt-2 sm:mt-0" : ""}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Oznacz wszystkie jako przeczytane
                            </Button>
                        )}
                    </div>
                    <CardDescription className="mt-1 text-xs md:text-sm">
                        Przeglądaj i zarządzaj powiadomieniami systemowymi, o wizytach, użytkownikach i przychodach.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-6'} h-auto sm:h-10 mb-4`}>
                            <TabsTrigger value="all" className={`text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 ${isMobile && activeTab === "all" ? "bg-barber text-white" : ""}`}>Wszystkie</TabsTrigger>
                            <TabsTrigger value="unread" className={`text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 ${isMobile && activeTab === "unread" ? "bg-barber text-white" : ""}`}>Nieprzeczytane</TabsTrigger>
                            {!isMobile && (
                                <>
                                    <TabsTrigger value="appointments">Wizyty</TabsTrigger>
                                    <TabsTrigger value="users">Użytkownicy</TabsTrigger>
                                    <TabsTrigger value="revenue">Przychody</TabsTrigger>
                                    <TabsTrigger value="system">System</TabsTrigger>
                                </>
                            )}
                        </TabsList>
                        {isMobile && (
                            <div className="mb-4 grid grid-cols-2 gap-2">
                                {(["appointments", "users", "revenue", "system"] as const).map(cat => (
                                    <Button
                                        key={cat}
                                        variant={activeTab === cat ? "default" : "outline"}
                                        onClick={() => setActiveTab(cat)}
                                        size="sm"
                                        className="text-xs flex items-center justify-center gap-1 h-8"
                                    >
                                        {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="space-y-3">
                            {filteredNotifications.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">
                                        {activeTab === "unread" ? "Wszystkie powiadomienia zostały przeczytane." : "Brak powiadomień w tej kategorii."}
                                    </p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${
                                            !notification.is_read ? 'border-l-4 border-barber bg-blue-50/40' : 'bg-white'
                                        }`}
                                    >
                                        <div className={`flex items-start gap-3 ${isMobile ? "p-2.5" : "p-3"}`}>
                                            <div className={`mt-1 flex flex-col items-center space-y-1 opacity-80 ${isMobile ? "hidden sm:flex" : "flex"}`}>
                                                {getNotificationIcon(notification.displayType)}
                                                {getCategoryIcon(notification.category)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} ${!notification.is_read ? 'text-gray-800' : 'text-gray-600'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 bg-barber rounded-full animate-pulse flex-shrink-0 ml-2" />
                                                    )}
                                                </div>
                                                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'} mb-1.5 line-clamp-2`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{isValidDateFn(notification.timestamp) ? formatDistanceToNow(notification.timestamp, { addSuffix: true }) : "Invalid date"}</span>
                                                    </div>
                                                    {notification.link && (
                                                        <RouterLink to={notification.link} className="text-barber hover:underline flex items-center gap-1">
                                                            <LinkIcon className="h-3 w-3" /> Szczegóły
                                                        </RouterLink>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5 ml-2">
                                                {!notification.is_read && (
                                                    <Button onClick={() => markAsRead(notification.id)} size="icon" variant="ghost" className={`text-green-600 hover:bg-green-100 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`} title="Oznacz jako przeczytane">
                                                        <CheckCircle className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                                    </Button>
                                                )}
                                                <Button onClick={() => deleteNotificationFE(notification.id)} size="icon" variant="ghost" className={`text-red-500 hover:bg-red-100 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`} title="Usuń powiadomienie">
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

export default AdminNotificationsPage;