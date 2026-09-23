// src/pages/barber-dashboard/BarberScheduleOverview.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDateLocale } from "@/hooks/useDateLocale";
import { NotificationDigest } from "@/components/szlif/NotificationDigest";
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
    Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, isValid } from "date-fns";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import "dayjs/locale/en";
import { JarLoader } from "@/components/szlif/Loading";

dayjs.locale("pl");

interface DailyAppointment {
    id: number;
    client_name: string;
    service_name: string;
    appointment_time: string;
    status: string;
    price: number | string;
}

const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case "pending":
            return "bg-secondary text-muted-foreground";
        case "confirmed":
            return "bg-primary/10 text-primary";
        case "completed":
            return "bg-series-7/10 text-series-7";
        case "canceled":
        case "cancelled":
            return "bg-destructive/10 text-destructive";
        case "no-show":
            return "bg-destructive/10 text-destructive";
        default:
            return "bg-muted text-foreground";
    }
};

const BarberScheduleOverview = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    const { t, lang } = useLanguage();
    const dateLocale = useDateLocale();

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [dailyAppointments, setDailyAppointments] = useState<DailyAppointment[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

    useEffect(() => {
        dayjs.locale(lang === 'pl' ? 'pl' : 'en');
    }, [lang]);

    const getStatusLabel = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return t("barberPanel.appointments.pending");
            case "confirmed":
                return t("barberPanel.appointments.confirmed");
            case "completed":
                return t("barberPanel.appointments.completed");
            case "canceled":
            case "cancelled":
                return t("barberPanel.appointments.cancelled");
            case "no-show":
                return t("barberPanel.appointments.noShow");
            default:
                return status;
        }
    };

    useEffect(() => {
        if (authContextLoading) {
            setIsLoadingAppointments(true);
            return;
        }
        if (!authUser || !token) {
            setDailyAppointments([]);
            setIsLoadingAppointments(false);
            return;
        }

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
                        let errorMsg = t("barberPanel.schedule.noAppointments");
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
                    toast.error(error.message || t("barberPanel.schedule.noAppointments"));
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


    }, [authUser, token, selectedDate, authContextLoading]);

    const handleDateChangeForMui = (newDate: Date | null) => {
        setSelectedDate(newDate || undefined);
    };

    // the digest loads itself now, so the page waits only on its own data
    if (authContextLoading || (isLoadingAppointments && dailyAppointments.length === 0)) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <JarLoader />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 items-start">
            <div className="xl:col-span-1 w-full space-y-4 md:space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                            {t("barberPanel.schedule.selectDate")}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            {t("barberPanel.schedule.selectDateDesc")}
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
                            <Bell className="h-5 w-5 mr-2 text-primary" />
                            {t("barberPanel.schedule.latestNotifications")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-3 sm:px-4">
                        <NotificationDigest allHref="/barber-dashboard/notifications" />
                    </CardContent>
                </Card>
            </div>

            <div className="xl:col-span-2 w-full">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                            <Clock className="h-5 w-5 mr-2 text-primary" />
                            {t("barberPanel.schedule.appointmentsFor")}{" "}
                            {selectedDate && isValid(selectedDate)
                                ? format(selectedDate, "PPP", { locale: dateLocale })
                                : "..."}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            {t("barberPanel.schedule.appointmentsDesc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAppointments && dailyAppointments.length === 0 ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                                <p className="text-muted-foreground text-sm">{t("barberPanel.loading")}</p>
                            </div>
                        ) : dailyAppointments.length > 0 ? (
                            <div className="space-y-3 sm:space-y-4">
                                {dailyAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="plate flex flex-col items-start justify-between p-3 sm:flex-row sm:items-center sm:p-4"
                                    >
                                        <div className="flex items-center mb-2 sm:mb-0 w-full sm:w-auto">
                                            <div
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-foreground/30 bg-secondary text-foreground"
                                            >
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div className="ml-3 min-w-0 flex-1">
                                                <h4 className="font-medium text-foreground text-sm sm:text-base truncate">
                                                    {apt.client_name}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                    {apt.service_name} &bull;{" "}
                                                    {parseFloat(String(apt.price)).toFixed(2)} PLN
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-1 sm:mt-0">
                                            <p className="font-medium text-foreground flex items-center text-xs sm:text-sm whitespace-nowrap">
                                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-muted-foreground" />
                                                {isValid(new Date(apt.appointment_time))
                                                    ? format(
                                                        new Date(apt.appointment_time),
                                                        "p",
                                                        { locale: dateLocale }
                                                    )
                                                    : "—"}
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
                                <Info className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <h3 className="text-md font-medium text-foreground mb-1">
                                    {t("barberPanel.schedule.noAppointments")}{" "}
                                    {selectedDate && isValid(selectedDate)
                                        ? format(selectedDate, "PPP", { locale: dateLocale })
                                        : ""}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {t("barberPanel.schedule.todaySchedule")}
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
