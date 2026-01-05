// src/pages/barber-dashboard/BarberNotificationsPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Info,
    CalendarDays,
    Users as UsersIcon,
    DollarSign,
    Clock,
    Trash2,
    Link as LinkIconUI
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { formatDistanceToNow, isValid as isValidDateFn } from "date-fns";
import { pl } from "date-fns/locale";
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

const BarberNotificationsPage = () => {
    const { token, loading: authContextLoading, user: authUser } = useAuth();
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState("all");
    const [notifications, setNotifications] = useState<AdminNotificationFE[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const mapBackendNotificationToFrontend = (notif: AdminNotificationBackend): AdminNotificationFE => {
        let displayType: AdminNotificationFE["displayType"] = "info";
        let category: AdminNotificationFE["category"] = "other";

        switch (notif.type.toLowerCase()) {
            case "new_booking_barber":
            case "appointment_confirmed_by_admin_staff":
            case "appointment_status_changed_by_barber":
                displayType = "info";
                category = "appointments";
                break;
            case "new_review":
                displayType = "success";
                category = "users";
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
        if (authContextLoading) {
            setIsLoading(true);
            return;
        }
        if (!token || !authUser) {
            setIsLoading(false);
            setNotifications([]);
            if (!authContextLoading) sonnerToast.error("Błąd autoryzacji. Proszę się zalogować.");
            return;
        }

        const fetchNotifications = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Nie udało się pobrać powiadomień barbera" }));
                    throw new Error(errorData.error || "Nie udało się pobrać powiadomień barbera");
                }
                const data: AdminNotificationBackend[] = await response.json();
                setNotifications(data.map(mapBackendNotificationToFrontend));
            } catch (error: any) {
                sonnerToast.error(error.message);
                setNotifications([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, [token, authUser, authContextLoading]);

    const getFilteredNotifications = () => {
        if (activeTab === "all") return notifications;
        if (activeTab === "unread") return notifications.filter(n => !n.is_read);
        return notifications.filter(n => n.category === activeTab || n.type.toLowerCase().includes(activeTab));
    };

    const unreadCount = useMemo(
        () => notifications.filter(n => !n.is_read).length,
        [notifications]
    );

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
            case "revenue": return <DollarSign className="h-4 w-4 text-gray-500" />;
            default: return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    const markAsRead = async (id: number) => {
        if (!token) {
            sonnerToast.error("Błąd autoryzacji.");
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Nie udało się oznaczyć jako przeczytane" }));
                throw new Error(errorData.error || "Nie udało się oznaczyć powiadomienia jako przeczytane.");
            }
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === id
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
        } catch (error: any) {
            sonnerToast.error(error.message || "Nie udało się oznaczyć powiadomienia jako przeczytane.");
        }
    };

    const deleteNotificationFE = async (id: number) => {
        if (!token) {
            sonnerToast.error("Błąd autoryzacji.");
            return;
        }
        if (!window.confirm("Czy na pewno chcesz usunąć to powiadomienie?")) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Nie udało się usunąć powiadomienia" }));
                throw new Error(errorData.error || "Nie udało się usunąć powiadomienia.");
            }
            setNotifications(prev => prev.filter(n => n.id !== id));
            sonnerToast.success("Powiadomienie usunięte.");
        } catch (error: any) {
            sonnerToast.error(error.message || "Nie udało się usunąć powiadomienia.");
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
                const errorData = await response.json().catch(() => ({ error: "Nie udało się oznaczyć wszystkich jako przeczytane" }));
                throw new Error(errorData.error || "Nie udało się oznaczyć wszystkich jako przeczytane.");
            }
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, is_read: true }))
            );
            sonnerToast.success("Wszystkie powiadomienia oznaczono jako przeczytane.");
        } catch (error: any) {
            sonnerToast.error(error.message || "Nie udało się oznaczyć wszystkich jako przeczytane.");
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
        <div className="space-y-4 md:space-y-6 p-1">
            <Card className="shadow-sm">
                <CardHeader className="border-b pb-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex items-center gap-2">
                            <Bell className="h-6 w-6 text-barber" />
                            <CardTitle className="text-xl md:text-2xl">
                                Moje powiadomienia
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">
                                        {unreadCount} NOWE
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
                                Oznacz wszystkie jako przeczytane
                            </Button>
                        )}
                    </div>
                    <CardDescription className="mt-1 text-xs md:text-sm">
                        Przeglądaj i zarządzaj powiadomieniami związanymi z Twoją pracą.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className={`grid w-full grid-cols-2 h-auto sm:h-10 mb-4`}>
                            <TabsTrigger
                                value="all"
                                className={`text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 ${isMobile && activeTab === "all" ? "bg-primary text-primary-foreground" : ""}`}
                            >
                                Wszystkie
                            </TabsTrigger>
                            <TabsTrigger
                                value="unread"
                                className={`text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 ${isMobile && activeTab === "unread" ? "bg-primary text-primary-foreground" : ""}`}
                            >
                                Nieprzeczytane
                            </TabsTrigger>
                        </TabsList>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {filteredNotifications.length === 0 ? (
                                <div className="py-10 text-center">
                                    <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">
                                        {activeTab === "unread"
                                            ? "Wszystkie powiadomienia zostały przeczytane."
                                            : "Brak powiadomień w tej kategorii."}
                                    </p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${
                                            !notification.is_read
                                                ? 'border-l-4 border-barber bg-barber/5'
                                                : 'bg-card'
                                        }`}
                                    >
                                        <div className={`flex items-start gap-3 ${isMobile ? "p-2.5" : "p-3"}`}>
                                            <div className={`mt-1 flex flex-col items-center space-y-1 opacity-80 ${isMobile ? "hidden sm:flex" : "flex"}`}>
                                                {getNotificationIcon(notification.displayType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4
                                                        className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} ${
                                                            !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                                                        }`}
                                                    >
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
                                                        <span>
                                                            {isValidDateFn(new Date(notification.created_at))
                                                                ? formatDistanceToNow(new Date(notification.created_at), {
                                                                    addSuffix: true,
                                                                    locale: pl,
                                                                })
                                                                : "Nieprawidłowa data"}
                                                        </span>
                                                    </div>
                                                    {notification.link && (
                                                        <RouterLink
                                                            to={notification.link}
                                                            className="text-primary hover:underline flex items-center gap-1"
                                                        >
                                                            <LinkIconUI className="h-3 w-3" /> Szczegóły
                                                        </RouterLink>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5 ml-2">
                                                {!notification.is_read && (
                                                    <Button
                                                        onClick={() => markAsRead(notification.id)}
                                                        size="icon"
                                                        variant="ghost"
                                                        className={`text-green-600 hover:bg-green-100 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`}
                                                        title="Oznacz jako przeczytane"
                                                    >
                                                        <CheckCircle className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => deleteNotificationFE(notification.id)}
                                                    size="icon"
                                                    variant="ghost"
                                                    className={`text-destructive hover:bg-destructive/10 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`}
                                                    title="Usuń powiadomienie"
                                                >
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
