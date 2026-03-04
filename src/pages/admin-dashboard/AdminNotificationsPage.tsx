import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Info,
    Clock,
    Trash2,
    Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, isValid as isValidDateFn } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { Link as RouterLink } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

interface AdminNotificationBackend {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string | null;
    is_read: boolean;
    created_at: string;
}

interface AdminNotificationFE extends AdminNotificationBackend {
    timestamp: Date;
    displayType: "info" | "warning" | "success" | "error";
}

const AdminNotificationsPage = () => {
    const { token, loading: authLoading } = useAuth();
    const isMobile = useIsMobile();
    const { t, lang } = useLanguage();
    const dateLocale = lang === "pl" ? pl : enUS;

    const [notifications, setNotifications] = useState<AdminNotificationFE[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const mapNotification = (notif: AdminNotificationBackend): AdminNotificationFE => {
        let displayType: AdminNotificationFE["displayType"] = "info";
        if (notif.type.includes("error")) displayType = "error";
        else if (notif.type.includes("success") || notif.type.includes("confirmed")) displayType = "success";
        else if (notif.type.includes("warning")) displayType = "warning";
        return { ...notif, timestamp: new Date(notif.created_at), displayType };
    };

    const fetchNotifications = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(t("adminPanel.notifications.loadFailed"));
            const data: AdminNotificationBackend[] = await response.json();
            setNotifications(data.map(mapNotification));
        } catch (error: any) {
            toast.error(error.message || t("adminPanel.notifications.loadFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchNotifications();
        }
    }, [token, authLoading]);

    const { unreadNotifications, readNotifications } = useMemo(() => {
        const unread = notifications.filter(n => !n.is_read);
        const read = notifications.filter(n => n.is_read);
        return { unreadNotifications: unread, readNotifications: read };
    }, [notifications]);

    const markAsRead = async (id: number) => {
        if (!token) return;
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(t("adminPanel.notifications.markReadFailed"));
            toast.success(t("adminPanel.notifications.markedRead"));
        } catch (error) {
            toast.error(t("adminPanel.notifications.serverError"));
            setNotifications(originalNotifications);
        }
    };

    const deleteNotification = async (id: number) => {
        if (!token) return;
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(t("adminPanel.notifications.deleteFailed"));
            toast.success(t("adminPanel.notifications.deleted"));
        } catch (error) {
            toast.error(t("adminPanel.notifications.serverError"));
            setNotifications(originalNotifications);
        }
    };

    const markAllAsRead = async () => {
        if (!token) return;
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/notifications/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(t("adminPanel.notifications.markAllFailed"));
            toast.success(t("adminPanel.notifications.markedAllRead"));
        } catch (error) {
            toast.error(t("adminPanel.notifications.serverError"));
            setNotifications(originalNotifications);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    const getNotificationIcon = (type: AdminNotificationFE["displayType"]) => {
        switch (type) {
            case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "error": return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const NotificationItem = ({ notification }: { notification: AdminNotificationFE }) => (
        <div className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${
            !notification.is_read
                ? 'border-l-4 border-barber bg-blue-50/40 dark:bg-blue-950/30'
                : 'bg-card'
        }`}>
            <div className="flex items-start gap-3 p-3">
                <div className="mt-1 opacity-80">{getNotificationIcon(notification.displayType)}</div>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} ${
                        !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                    }`}>{notification.title}</h4>
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'} my-1 line-clamp-2`}>
                        {notification.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>
                                {isValidDateFn(notification.timestamp)
                                    ? formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: dateLocale })
                                    : t("adminPanel.notifications.invalidDate")}
                            </span>
                        </div>
                        {notification.link && (
                            <RouterLink to={notification.link} className="text-barber hover:underline flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" /> {t("adminPanel.notifications.details")}
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
                            className="text-green-600 hover:bg-green-100 dark:hover:bg-green-950/30 h-7 w-7"
                            title={t("adminPanel.notifications.markRead")}
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        onClick={() => deleteNotification(notification.id)}
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30 h-7 w-7"
                        title={t("adminPanel.notifications.deleteLabel")}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-2 sm:p-4">
            <Card className="shadow-sm">
                <CardHeader className="border-b pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex items-center gap-3">
                            <Bell className="h-6 w-6 text-barber" />
                            <CardTitle className="text-xl md:text-2xl">{t("adminPanel.notifications.title")}</CardTitle>
                        </div>
                        {unreadNotifications.length > 0 && (
                            <Button onClick={markAllAsRead} variant="outline" size="sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t("adminPanel.notifications.markAllRead")}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-6">
                    {unreadNotifications.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-semibold text-lg text-foreground">{t("adminPanel.notifications.newLabel")}</h3>
                                <Badge variant="destructive">{unreadNotifications.length}</Badge>
                            </div>
                            <div className="space-y-3">
                                {unreadNotifications.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        </section>
                    )}
                    {readNotifications.length > 0 && (
                        <section>
                            <h3 className="font-semibold text-lg text-muted-foreground mb-3 border-t border-border pt-4 mt-6">
                                {t("adminPanel.notifications.readLabel")}
                            </h3>
                            <div className="space-y-3 opacity-80">
                                {readNotifications.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        </section>
                    )}
                    {notifications.length === 0 && (
                        <div className="py-16 text-center">
                            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">{t("adminPanel.notifications.none")}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminNotificationsPage;
