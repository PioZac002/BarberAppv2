import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    Calendar,
    CheckCircle,
    Trash2,
    Gift,
    AlertCircle,
    Star,
    Settings,
    ShieldCheck,
    HelpCircle,
    Info,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, isValid } from "date-fns";
import { pl } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string | null;
    is_read: boolean;
    created_at: string;
}

const UserNotifications = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    useRequireAuth({ allowedRoles: ["client"] });

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (authContextLoading) {
            setIsDataLoading(true);
            return;
        }
        if (!token || !authUser) {
            setIsDataLoading(false);
            setNotifications([]);
            // toast.error("Wymagane jest logowanie, aby zobaczyć powiadomienia.");
            return;
        }

        const fetchNotifications = async () => {
            setIsDataLoading(true);
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/user/notifications`,
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
                        /*ignore*/
                    }
                    throw new Error(errorMsg);
                }
                const data: Notification[] = await response.json();
                setNotifications(data);
            } catch (error: any) {
                toast.error(error.message || "Nie udało się wczytać powiadomień.");
                setNotifications([]);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchNotifications();
    }, [authUser, token, authContextLoading]);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const markAsRead = async (id: number) => {
        if (!token) {
            toast.error("Błąd uwierzytelniania.");
            return;
        }
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/user/notifications/${id}/read`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: "Nie udało się oznaczyć jako przeczytane",
                }));
                throw new Error(
                    errorData.error || "Nie udało się oznaczyć powiadomienia jako przeczytane"
                );
            }
            setNotifications((prev) =>
                prev.map((notification) =>
                    notification.id === id ? { ...notification, is_read: true } : notification
                )
            );
        } catch (error: any) {
            toast.error(
                error.message || "Nie udało się oznaczyć powiadomienia jako przeczytane."
            );
        }
    };

    const markAllAsRead = async () => {
        if (!token || unreadCount === 0) return;
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/user/notifications/read-all`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: "Nie udało się oznaczyć wszystkich jako przeczytane",
                }));
                throw new Error(
                    errorData.error || "Nie udało się oznaczyć wszystkich jako przeczytane"
                );
            }
            setNotifications((prev) =>
                prev.map((notification) => ({ ...notification, is_read: true }))
            );
            toast.success("Wszystkie powiadomienia oznaczono jako przeczytane.");
        } catch (error: any) {
            toast.error(
                error.message || "Nie udało się oznaczyć wszystkich jako przeczytane."
            );
        }
    };

    const deleteNotification = async (id: number) => {
        if (!token) {
            toast.error("Błąd uwierzytelniania.");
            return;
        }
        if (!window.confirm("Czy na pewno chcesz usunąć to powiadomienie?")) return;
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/user/notifications/${id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: "Nie udało się usunąć powiadomienia",
                }));
                throw new Error(errorData.error || "Nie udało się usunąć powiadomienia");
            }
            setNotifications((prev) =>
                prev.filter((notification) => notification.id !== id)
            );
            toast.success("Powiadomienie zostało usunięte.");
        } catch (error: any) {
            toast.error(error.message || "Nie udało się usunąć powiadomienia.");
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "appointment_confirmed":
            case "appointment_canceled":
            case "appointment_pending":
                return Calendar;
            case "promotion":
            case "welcome":
                return Gift;
            case "reminder":
                return AlertCircle;
            case "review_request":
                return Star;
            case "system_update":
                return Settings;
            case "new_feature":
                return HelpCircle;
            case "account_security":
                return ShieldCheck;
            default:
                return Bell;
        }
    };

    const getNotificationColorClass = (type: string) => {
        switch (type) {
            case "appointment_confirmed":
                return "text-green-600";
            case "appointment_canceled":
                return "text-red-600";
            case "appointment_pending":
                return "text-yellow-600";
            case "promotion":
                return "text-purple-600";
            case "reminder":
                return "text-orange-600";
            case "review_request":
                return "text-yellow-500";
            case "system_update":
            case "new_feature":
                return "text-indigo-600";
            case "account_security":
                return "text-red-700";
            case "welcome":
                return "text-barber";
            default:
                return "text-gray-600";
        }
    };

    if (authContextLoading || isDataLoading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    if (!authContextLoading && !authUser) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">
                    Nie udało się uwierzytelnić użytkownika, aby wyświetlić powiadomienia.
                </p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                    <Link to="/login">Przejdź do logowania</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <CardTitle className="flex items-center text-xl sm:text-2xl">
                        <Bell className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-barber" />
                        Powiadomienia
                        {unreadCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="ml-2 text-xs sm:text-sm"
                            >
                                {unreadCount} nowe
                            </Badge>
                        )}
                    </CardTitle>
                    {notifications.length > 0 && unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            className="flex items-center self-start sm:self-center"
                        >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Oznacz wszystkie jako przeczytane
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {notifications.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                            {notifications.map((notification) => {
                                const IconComponent =
                                    getNotificationIcon(notification.type);
                                const notificationElement = (
                                    <div
                                        className={`p-3 sm:p-4 rounded-lg border transition-colors ${
                                            notification.is_read
                                                ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3 flex-1">
                                                <div
                                                    className={`flex-shrink-0 p-2 rounded-full ${
                                                        notification.is_read
                                                            ? "bg-gray-200"
                                                            : "bg-white shadow-sm"
                                                    }`}
                                                >
                                                    <IconComponent
                                                        className={`h-5 w-5 ${getNotificationColorClass(
                                                            notification.type
                                                        )}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-0.5 sm:mb-1">
                                                        <h3
                                                            className={`font-medium text-sm sm:text-base ${
                                                                notification.is_read
                                                                    ? "text-gray-700"
                                                                    : "text-gray-900"
                                                            }`}
                                                        >
                                                            {notification.title}
                                                        </h3>
                                                        {!notification.is_read && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                                                        )}
                                                    </div>
                                                    <p
                                                        className={`text-xs sm:text-sm ${
                                                            notification.is_read
                                                                ? "text-gray-600"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                                                        {isValid(
                                                            new Date(
                                                                notification.created_at
                                                            )
                                                        )
                                                            ? formatDistanceToNow(
                                                                new Date(
                                                                    notification.created_at
                                                                ),
                                                                {
                                                                    addSuffix: true,
                                                                    locale: pl,
                                                                }
                                                            )
                                                            : "Nieprawidłowa data"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-1 ml-2">
                                                {!notification.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            markAsRead(notification.id);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 w-7 sm:h-8 sm:w-8"
                                                        title="Oznacz jako przeczytane"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8"
                                                    title="Usuń powiadomienie"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                                return notification.link ? (
                                    <Link
                                        to={notification.link}
                                        key={notification.id}
                                        className="block no-underline"
                                    >
                                        {notificationElement}
                                    </Link>
                                ) : (
                                    <div key={notification.id}>{notificationElement}</div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                Brak powiadomień
                            </h3>
                            <p className="text-gray-500">
                                Wszystko nadrobione! Nowe powiadomienia pojawią się tutaj.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UserNotifications;
