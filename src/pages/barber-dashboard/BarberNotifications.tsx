import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Bell,
    Calendar,
    User,
    Star,
    CheckCircle,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns"; // Do formatowania daty

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean; // Zmieniono z 'read' na 'is_read' zgodnie z bazą danych
    created_at: string; // Zmieniono z 'time'
    // Dodaj inne pola jeśli są potrzebne, np. link
}

const BarberNotifications = () => {
    const { user, loading } = useRequireAuth({ allowedRoles: ["barber", "admin"] });
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!user || loading) return;

        const fetchNotifications = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/barber/notifications", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (!response.ok) throw new Error("Failed to fetch notifications");
                const data = await response.json();
                setNotifications(data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load notifications");
            }
        };

        fetchNotifications();
    }, [user, loading]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsRead = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:3000/api/barber/notifications/${id}/read`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!response.ok) throw new Error("Failed to mark as read");
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === id ? { ...notification, is_read: true } : notification
                )
            );
            // toast.success("Notification marked as read"); // Można usunąć dla mniejszej ilości toastów
        } catch (error) {
            console.error(error);
            toast.error("Failed to mark notification as read");
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            const response = await fetch("http://localhost:3000/api/barber/notifications/read-all", { // Nowy endpoint
                method: "PUT",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!response.ok) throw new Error("Failed to mark all as read");
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, is_read: true }))
            );
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error(error);
            toast.error("Failed to mark all notifications as read");
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:3000/api/barber/notifications/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!response.ok) throw new Error("Failed to delete notification");
            setNotifications(prev => prev.filter(notification => notification.id !== id));
            toast.success("Notification deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete notification");
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "new_appointment": // Przykładowe typy
            case "appointment_canceled":
            case "appointment_confirmed":
                return Calendar;
            case "new_review":
                return Star;
            case "profile_update": // Przykładowy typ
                return User;
            default:
                return Bell;
        }
    };

    const getNotificationColor = (type: string) => {
        // Możesz dostosować kolory do typów
        switch (type) {
            case "new_appointment": return "text-blue-600";
            case "appointment_canceled": return "text-red-600";
            case "new_review": return "text-yellow-600";
            default: return "text-gray-600";
        }
    };

    return (
        <DashboardLayout title="Notifications">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                        <Bell className="h-5 w-5 mr-2 text-barber" />
                        Notifications
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {unreadCount} new
                            </Badge>
                        )}
                    </CardTitle>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            className="flex items-center"
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark All Read
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {notifications.length > 0 ? (
                        <div className="space-y-4">
                            {notifications.map((notification) => {
                                const IconComponent = getNotificationIcon(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 rounded-lg border transition-colors ${
                                            notification.is_read
                                                ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3 flex-1">
                                                <div className={`p-2 rounded-full ${
                                                    notification.is_read ? "bg-gray-200" : "bg-white shadow-sm"
                                                }`}>
                                                    <IconComponent
                                                        className={`h-5 w-5 ${getNotificationColor(notification.type)}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h3 className={`font-medium ${
                                                            notification.is_read ? "text-gray-700" : "text-gray-900"
                                                        }`}>
                                                            {notification.title}
                                                        </h3>
                                                        {!notification.is_read && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm ${
                                                        notification.is_read ? "text-gray-600" : "text-gray-700"
                                                    }`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {format(new Date(notification.created_at), "PPpp")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-1 ml-2 sm:ml-4">
                                                {!notification.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon" // Zmieniono na 'icon' dla spójności
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                                                        title="Mark as read"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon" // Zmieniono na 'icon'
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                    title="Delete notification"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
                            <p className="text-gray-500">
                                You're all caught up! New notifications will appear here.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default BarberNotifications;