import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Bell,
    Clock,
    CheckSquare,
    ThumbsUp,
    Info,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface UpcomingAppointmentInfo {
    id: number;
    date: string;
    time: string;
    service: string;
    barber: string;
}

interface UserStatsInfo {
    totalAppointments: number;
    hoursSaved: string;
    avgRatingGiven: number | null;
}

interface OverviewNotificationInfo {
    id: number;
    title: string;
    created_at: string;
    link?: string | null;
    is_read: boolean;
    type?: string;
}

const UserOverview = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    const { t, lang } = useLanguage();
    const dateLocale = lang === "pl" ? pl : enUS;

    const [upcomingAppointment, setUpcomingAppointment] = useState<UpcomingAppointmentInfo | null>(null);
    const [userStats, setUserStats] = useState<UserStatsInfo | null>(null);
    const [recentNotifications, setRecentNotifications] = useState<OverviewNotificationInfo[]>([]);
    const [isOverviewDataLoadingLocal, setIsOverviewDataLoadingLocal] = useState(true);

    useEffect(() => {
        if (authContextLoading) {
            setIsOverviewDataLoadingLocal(true);
            return;
        }
        if (!authUser || !token) {
            setIsOverviewDataLoadingLocal(false);
            setUpcomingAppointment(null);
            setUserStats(null);
            setRecentNotifications([]);
            return;
        }

        const fetchOverviewData = async () => {
            setIsOverviewDataLoadingLocal(true);
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [statsRes, nextApptRes, notifRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/stats`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/appointments/next-upcoming`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/notifications`, { headers }),
                ]);

                if (statsRes.ok) setUserStats(await statsRes.json());
                else console.error("Failed to fetch user stats:", await statsRes.text());

                if (nextApptRes.ok) setUpcomingAppointment(await nextApptRes.json());
                else {
                    setUpcomingAppointment(null);
                    console.error("Failed to fetch next upcoming appointment:", await nextApptRes.text());
                }

                if (notifRes.ok) {
                    const allNotifs: OverviewNotificationInfo[] = await notifRes.json();
                    setRecentNotifications(allNotifs.slice(0, 3));
                } else console.error("Failed to fetch recent notifications:", await notifRes.text());
            } catch (error) {
                console.error("Error fetching overview data:", error);
                toast.error(t("userPanel.overview.loadError"));
            } finally {
                setIsOverviewDataLoadingLocal(false);
            }
        };
        fetchOverviewData();
    }, [authUser, token, authContextLoading]);

    const StatCard = ({
        title,
        value,
        icon,
        description,
        linkTo,
        isAction,
    }: {
        title: string;
        value: string | number;
        icon: React.ReactNode;
        description?: string;
        linkTo?: string;
        isAction?: boolean;
    }) => {
        const content = (
            <div className={`flex items-center p-3 sm:p-4 rounded-lg shadow-sm transition-all duration-200 h-full ${
                isAction ? "bg-barber/5 hover:bg-barber/10" : "bg-muted/50 hover:bg-muted"
            }`}>
                <div className={`p-2 sm:p-3 rounded-full mr-3 sm:mr-4 ${isAction ? "bg-barber/20" : "bg-barber/10"}`}>
                    {icon}
                </div>
                <div>
                    <p className={`text-xs sm:text-sm font-medium ${isAction ? "text-barber" : "text-muted-foreground"}`}>
                        {title}
                    </p>
                    <p className={`text-lg sm:text-xl font-semibold ${isAction ? "text-barber" : "text-foreground"}`}>
                        {value}
                    </p>
                    {description && !isAction && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
        );
        return linkTo ? (
            <Link to={linkTo} className="block no-underline h-full">{content}</Link>
        ) : (
            <div className="h-full">{content}</div>
        );
    };

    if (isOverviewDataLoadingLocal || authContextLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-pulse">
                <div className="md:col-span-2 xl:col-span-3">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-muted rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="h-20 bg-muted rounded-lg"></div>
                                <div className="h-20 bg-muted rounded-lg"></div>
                                <div className="h-20 bg-muted rounded-lg"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader><div className="h-6 bg-muted rounded w-1/2"></div></CardHeader>
                        <CardContent><div className="h-24 bg-muted rounded-lg"></div></CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="h-10 bg-muted rounded-md"></div>
                                <div className="h-10 bg-muted rounded-md"></div>
                                <div className="h-10 bg-muted rounded-md"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 xl:col-span-3">
                <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl sm:text-2xl font-semibold">
                            {t("userPanel.overview.greeting")}, {authUser?.firstName || ""}!
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            {t("userPanel.overview.welcomeMsg")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <StatCard
                                title={t("userPanel.overview.appointmentCount")}
                                value={userStats?.totalAppointments?.toString() ?? "0"}
                                icon={<CheckSquare className="h-6 w-6 text-barber" />}
                                description={t("userPanel.overview.excludingCancelled")}
                            />
                            <StatCard
                                title={t("userPanel.overview.averageRating")}
                                value={userStats?.avgRatingGiven ? `${userStats.avgRatingGiven}/5.0` : t("userPanel.overview.noRating")}
                                icon={<ThumbsUp className="h-6 w-6 text-barber" />}
                                description={t("userPanel.overview.averageRatingLabel")}
                            />
                            <StatCard
                                title={t("userPanel.overview.quickBooking")}
                                value={t("userPanel.overview.findSlot")}
                                icon={<Calendar className="h-6 w-6 text-barber" />}
                                linkTo="/booking"
                                isAction
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-2">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <Calendar className="h-5 w-5 mr-2 text-barber" />
                            {t("userPanel.overview.nextAppointment")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointment && upcomingAppointment.date && isValid(new Date(upcomingAppointment.date)) ? (
                            <div className="bg-barber/5 rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-md sm:text-lg text-foreground">
                                            {upcomingAppointment.service}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            {t("userPanel.overview.with")} {upcomingAppointment.barber}
                                        </p>
                                    </div>
                                    <div className="mt-2 sm:mt-0 text-xs sm:text-sm flex items-center text-foreground">
                                        <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                        <span>
                                            {format(new Date(upcomingAppointment.date), "PPP", { locale: dateLocale })}{" "}
                                            {upcomingAppointment.time}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                        className="w-full sm:w-auto border-barber text-barber hover:bg-barber/10"
                                    >
                                        {t("userPanel.overview.reschedule")}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground mb-3">
                                    {t("userPanel.overview.noUpcoming")}
                                </p>
                                <Button className="bg-barber hover:bg-barber-muted" asChild>
                                    <Link to="/booking">{t("userPanel.overview.bookAppointment")}</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-1">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <Bell className="h-5 w-5 mr-2 text-barber" />
                            {t("userPanel.overview.latestNotifications")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentNotifications.length > 0 ? (
                            <ul className="space-y-2.5">
                                {recentNotifications.map((notif) => (
                                    <li
                                        key={notif.id}
                                        className={`p-2.5 rounded-md border ${
                                            notif.is_read
                                                ? "bg-muted/50 border-border"
                                                : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                                        }`}
                                    >
                                        <Link
                                            to={notif.link || "/user-dashboard/notifications"}
                                            className="block group"
                                        >
                                            <p className={`text-xs sm:text-sm font-medium truncate group-hover:text-barber ${
                                                notif.is_read ? "text-muted-foreground" : "text-foreground"
                                            }`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {isValid(new Date(notif.created_at))
                                                    ? formatDistanceToNow(new Date(notif.created_at), {
                                                        addSuffix: true,
                                                        locale: dateLocale,
                                                    })
                                                    : "—"}
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                {t("userPanel.overview.noNotifications")}
                            </p>
                        )}
                        <Button variant="link" className="w-full mt-3 text-barber px-0 text-xs sm:text-sm" asChild>
                            <Link to="/user-dashboard/notifications">
                                {t("userPanel.overview.viewAllNotifications")}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserOverview;
