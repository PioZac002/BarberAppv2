// src/pages/admin-dashboard/AdminOverview.tsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    Calendar,
    Scissors,
    DollarSign,
    Bell,
    ArrowRight,
    Info,
    Clock,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
    formatDistanceToNow,
    isValid as isValidDate,
} from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
    ComposedChart,
    Line,
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart";

interface StatsData {
    users: number;
    activeAppointments: number;
    services: number;
    revenue: number;
}

interface HourlyReportDataItem {
    date: string; // "HH:00"
    appointments: number;
    revenue: number;
    barbers?: { [barberName: string]: number };
}

interface AdminNotification {
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

const AdminOverview = () => {
    const { token, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<StatsData | null>(null);
    const [todaysHourlyData, setTodaysHourlyData] = useState<HourlyReportDataItem[]>([]);
    const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingTodaysData, setLoadingTodaysData] = useState(true);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!token) {
            setLoadingStats(false);
            setLoadingTodaysData(false);
            setLoadingNotifications(false);
            toast.error("Błąd autoryzacji. Proszę się zalogować.");
            return;
        }

        const fetchDashboardData = async () => {
            setLoadingStats(true);
            setLoadingTodaysData(true);
            setLoadingNotifications(true);
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [statsRes, todaysDataRes, notificationsRes] =
                    await Promise.all([
                        fetch(
                            `${import.meta.env.VITE_API_URL}/api/admin/stats`,
                            { headers }
                        ),
                        fetch(
                            `${import.meta.env.VITE_API_URL}/api/admin/reports-data?timeRange=1day`,
                            { headers }
                        ),
                        fetch(
                            `${import.meta.env.VITE_API_URL}/api/admin/notifications?limit=5`,
                            { headers }
                        ),
                    ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                } else {
                    console.error(
                        "Failed to fetch stats. Status:",
                        statsRes.status
                    );
                    toast.error("Nie udało się wczytać statystyk ogólnych.");
                }

                if (todaysDataRes.ok) {
                    const reportData: HourlyReportDataItem[] =
                        await todaysDataRes.json();
                    setTodaysHourlyData(reportData);
                } else {
                    console.error(
                        "Failed to fetch today's hourly data. Status:",
                        todaysDataRes.status
                    );
                    toast.error(
                        "Nie udało się wczytać dzisiejszej aktywności."
                    );
                }

                if (notificationsRes.ok) {
                    const notifData = await notificationsRes.json();
                    setAdminNotifications(notifData);
                } else {
                    console.error(
                        "Failed to fetch admin notifications. Status:",
                        notificationsRes.status
                    );
                    toast.error("Nie udało się wczytać powiadomień.");
                }
            } catch (error: any) {
                console.error("Error fetching dashboard data:", error);
                toast.error(
                    error.message || "Nie udało się wczytać danych panelu."
                );
            } finally {
                setLoadingStats(false);
                setLoadingTodaysData(false);
                setLoadingNotifications(false);
            }
        };

        fetchDashboardData();
    }, [token, authLoading]);

    const getNotificationIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "new_appointment_booked":
            case "appointment_status_changed":
            case "appointment_confirmed_by_admin":
            case "appointment_confirmed_log":
            case "appointment_confirmed_by_admin_staff":
            case "appointment_status_changed_by_barber":
                return <Calendar className="h-5 w-5 text-blue-500" />;
            case "new_user_registered":
                return <Users className="h-5 w-5 text-green-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const todaysChartConfig = useMemo(
        () => ({
            appointments: {
                label: "Wizyty (liczba)",
                color: "hsl(var(--chart-1))",
            },
            revenue: {
                label: "Przychód (PLN)",
                color: "hsl(var(--chart-2))",
            },
        }),
        []
    );

    const pageLoading =
        authLoading ||
        (loadingStats &&
            loadingTodaysData &&
            loadingNotifications &&
            !stats &&
            todaysHourlyData.length === 0 &&
            adminNotifications.length === 0);

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-16 w-16 animate-spin text-barber" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Użytkownicy
                                </p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">
                                    {stats?.users ?? 0}
                                </h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Aktywne Wizyty
                                </p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">
                                    {stats?.activeAppointments ?? 0}
                                </h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Wszystkie usługi
                                </p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">
                                    {stats?.services ?? 0}
                                </h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <Scissors className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Miesięczny przychód
                                </p>
                                <h4 className="text-3xl font-bold text-barber-dark mt-1">
                                    {stats?.revenue
                                        ? `${stats.revenue.toFixed(2)} PLN`
                                        : "0.00 PLN"}
                                </h4>
                            </div>
                            <div className="h-12 w-12 bg-barber/10 rounded-full flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-barber" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wykres godzinowy */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-barber" />
                            Zakończone wizyty dzisiaj
                        </CardTitle>
                        <CardDescription>
                            Godzinowe zestawienie liczby zakończonych wizyt
                            (status „completed”) i przychodów z nich
                            wygenerowanych.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingTodaysData && todaysHourlyData.length === 0 ? (
                            <div className="h-80 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-barber animate-spin" />
                            </div>
                        ) : todaysHourlyData.length > 0 ? (
                            <ChartContainer
                                config={todaysChartConfig}
                                className="h-[320px] w-full"
                            >
                                <ResponsiveContainer>
                                    <ComposedChart
                                        data={todaysHourlyData}
                                        margin={{
                                            top: 10,
                                            right: 20,
                                            left: 0,
                                            bottom: 20,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            interval="preserveStartEnd"
                                            label={{
                                                value: "Godzina",
                                                position: "insideBottom",
                                                offset: -10,
                                                fontSize: 12,
                                            }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke={
                                                todaysChartConfig.appointments
                                                    .color
                                            }
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                            tickFormatter={value =>
                                                `${value}`
                                            }
                                            label={{
                                                value: "Liczba wizyt",
                                                angle: -90,
                                                position: "insideLeft",
                                                offset: 10,
                                                fontSize: 12,
                                            }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke={
                                                todaysChartConfig.revenue.color
                                            }
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={value =>
                                                `${value} zł`
                                            }
                                            label={{
                                                value: "Przychód (PLN)",
                                                angle: 90,
                                                position: "insideRight",
                                                offset: 10,
                                                fontSize: 12,
                                            }}
                                        />
                                        <ChartTooltip
                                            cursor={{ fill: "rgba(0,0,0,0.04)" }}
                                            content={
                                                <ChartTooltipContent
                                                    indicator="dot"
                                                    labelFormatter={value =>
                                                        `Godzina: ${value}`
                                                    }
                                                    formatter={(value, name) => {
                                                        if (
                                                            name ===
                                                            "Przychód (PLN)"
                                                        ) {
                                                            return [
                                                                `${Number(
                                                                    value
                                                                ).toFixed(
                                                                    2
                                                                )} PLN`,
                                                                name,
                                                            ];
                                                        }
                                                        return [value, name];
                                                    }}
                                                />
                                            }
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={32}
                                            iconType="circle"
                                        />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="appointments"
                                            fill={
                                                todaysChartConfig.appointments
                                                    .color
                                            }
                                            radius={[4, 4, 0, 0]}
                                            name="Wizyty (completed)"
                                            barSize={18}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke={
                                                todaysChartConfig.revenue.color
                                            }
                                            strokeWidth={2}
                                            dot={{ r: 2 }}
                                            activeDot={{ r: 4 }}
                                            name="Przychód (PLN)"
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-gray-500 text-center px-4">
                                <Info className="h-10 w-10 mb-2" />
                                Na dziś nie odnotowano jeszcze żadnych
                                zakończonych wizyt ani przychodów.
                                <p className="mt-1 text-xs text-gray-400">
                                    (Wykres opiera się na danych zwracanych
                                    przez endpoint raportowy – upewnij się, że
                                    API liczy tylko wizyty o statusie
                                    „completed”.)
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Powiadomienia */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Bell className="h-5 w-5 mr-2 text-barber" />
                            Powiadomienia
                        </CardTitle>
                        <CardDescription>
                            Ostatnie najważniejsze powiadomienia.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingNotifications &&
                        adminNotifications.length === 0 ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-8 w-8 text-barber animate-spin" />
                            </div>
                        ) : adminNotifications.length > 0 ? (
                            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2">
                                {adminNotifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 rounded-md border ${
                                            notification.is_read
                                                ? "bg-gray-50 border-gray-200"
                                                : "bg-blue-50 border-blue-200"
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div
                                                className={`flex-shrink-0 p-2 rounded-full ${
                                                    notification.is_read
                                                        ? "bg-gray-200"
                                                        : "bg-white shadow-sm"
                                                }`}
                                            >
                                                {getNotificationIcon(
                                                    notification.type
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4
                                                        className={`text-sm font-medium ${
                                                            notification.is_read
                                                                ? "text-gray-700"
                                                                : "text-gray-900"
                                                        } truncate`}
                                                    >
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse ml-2"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="text-xs text-gray-400 mt-1 flex justify-between items-center">
                                                    <span>
                                                        {isValidDate(
                                                            new Date(
                                                                notification.created_at
                                                            )
                                                        )
                                                            ? formatDistanceToNow(
                                                                new Date(
                                                                    notification.created_at
                                                                ),
                                                                {
                                                                    addSuffix:
                                                                        true,
                                                                }
                                                            )
                                                            : "Nieprawidłowa data"}
                                                    </span>
                                                    {notification.link && (
                                                        <Link
                                                            to={
                                                                notification.link
                                                            }
                                                            className="text-barber hover:underline text-xs"
                                                        >
                                                            Pokaż
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {adminNotifications.length >= 5 && (
                                    <Link to="/admin-dashboard/notifications" className="block mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            Pokaż{" "}
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Info className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">
                                    Brak nowych powiadomień
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminOverview;
