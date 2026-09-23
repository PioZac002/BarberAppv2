import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardContent,
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
import { format, isValid } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDateLocale } from "@/hooks/useDateLocale";
import { NotificationDigest } from "@/components/szlif/NotificationDigest";

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

const UserOverview = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    const { t } = useLanguage();
    const dateLocale = useDateLocale();

    const [upcomingAppointment, setUpcomingAppointment] = useState<UpcomingAppointmentInfo | null>(null);
    const [userStats, setUserStats] = useState<UserStatsInfo | null>(null);
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
            return;
        }

        const fetchOverviewData = async () => {
            setIsOverviewDataLoadingLocal(true);
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [statsRes, nextApptRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/stats`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/appointments/next-upcoming`, { headers }),
                ]);

                if (statsRes.ok) setUserStats(await statsRes.json());
                else console.error("Failed to fetch user stats:", await statsRes.text());

                if (nextApptRes.ok) setUpcomingAppointment(await nextApptRes.json());
                else {
                    setUpcomingAppointment(null);
                    console.error("Failed to fetch next upcoming appointment:", await nextApptRes.text());
                }

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
        // a filed quantity: label in tracked caps, the figure set tabular,
        // the icon a small mark in the corner rather than a bubble
        const content = (
            <div
                className={`plate flex h-full flex-col justify-between gap-4 p-4 ${
                    isAction ? "plate-interactive border-primary/70" : ""
                }`}
            >
                <div className="flex items-start justify-between gap-3">
                    <p className="directions">{title}</p>
                    <span className={isAction ? "text-primary" : "text-muted-foreground/70"}>{icon}</span>
                </div>
                <div>
                    <p
                        className={
                            isAction
                                ? "label-caps text-base text-primary sm:text-lg"
                                : "net-line text-2xl font-semibold text-foreground sm:text-3xl"
                        }
                    >
                        {value}
                    </p>
                    {description && !isAction && (
                        <p className="mt-1 text-sm leading-snug text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
        );
        return linkTo ? (
            <Link to={linkTo} className="block h-full no-underline">{content}</Link>
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
                <section>
                    <div className="rule-double pb-3">
                        <h2 className="section-head text-xl sm:text-2xl">
                            {t("userPanel.overview.greeting")}, {authUser?.firstName || ""}!
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t("userPanel.overview.welcomeMsg")}
                        </p>
                    </div>
                    <div className="mt-5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                            <StatCard
                                title={t("userPanel.overview.appointmentCount")}
                                value={userStats?.totalAppointments?.toString() ?? "0"}
                                icon={<CheckSquare className="h-6 w-6 text-primary" />}
                                description={t("userPanel.overview.excludingCancelled")}
                            />
                            <StatCard
                                title={t("userPanel.overview.averageRating")}
                                value={userStats?.avgRatingGiven ? `${userStats.avgRatingGiven}/5.0` : t("userPanel.overview.noRating")}
                                icon={<ThumbsUp className="h-6 w-6 text-primary" />}
                                description={t("userPanel.overview.averageRatingLabel")}
                            />
                            <StatCard
                                title={t("userPanel.overview.quickBooking")}
                                value={t("userPanel.overview.findSlot")}
                                icon={<Calendar className="h-6 w-6 text-primary" />}
                                linkTo="/booking"
                                isAction
                            />
                        </div>
                    </div>
                </section>
            </div>

            <div className="md:col-span-2">
                <Card className="shadow-plate">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <Calendar className="h-5 w-5 mr-2 text-primary" />
                            {t("userPanel.overview.nextAppointment")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointment && upcomingAppointment.date && isValid(new Date(upcomingAppointment.date)) ? (
                            <div className="rounded-[2px] border border-primary/40 bg-accent/60 p-4">
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
                                        className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10"
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
                                <Button className="bg-primary hover:bg-primary/90" asChild>
                                    <Link to="/booking">{t("userPanel.overview.bookAppointment")}</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-1">
                <Card className="shadow-plate">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <Bell className="h-5 w-5 mr-2 text-primary" />
                            {t("userPanel.overview.latestNotifications")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <NotificationDigest allHref="/user-dashboard/notifications" />
                        <Button variant="link" className="w-full mt-3 text-primary px-0 text-xs sm:text-sm" asChild>
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
