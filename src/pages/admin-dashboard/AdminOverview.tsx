// src/pages/admin-dashboard/AdminOverview.tsx
import { useState, useEffect, useMemo } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Users,
    Calendar,
    Scissors,
    DollarSign,
    Bell,
    Info,
    Clock
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDateLocale } from "@/hooks/useDateLocale";
import { NotificationDigest } from "@/components/szlif/NotificationDigest";
import {
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
import { JarLoader } from "@/components/szlif/Loading";

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
    const { t } = useLanguage();
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
            toast.error(t('adminPanel.authError'));
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
                    toast.error(t('adminPanel.overview.errorStats'));
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
                    toast.error(t('adminPanel.overview.errorActivity'));
                }

                if (notificationsRes.ok) {
                    const notifData = await notificationsRes.json();
                    setAdminNotifications(notifData);
                } else {
                    console.error(
                        "Failed to fetch admin notifications. Status:",
                        notificationsRes.status
                    );
                    toast.error(t('adminPanel.overview.errorNotifications'));
                }
            } catch (error: any) {
                console.error("Error fetching dashboard data:", error);
                toast.error(
                    error.message || t('adminPanel.overview.errorDashboard')
                );
            } finally {
                setLoadingStats(false);
                setLoadingTodaysData(false);
                setLoadingNotifications(false);
            }
        };

        fetchDashboardData();
    }, [token, authLoading]);

    const todaysChartConfig = useMemo(
        () => ({
            appointments: {
                label: t('adminPanel.overview.visitsByCount'),
                color: "hsl(var(--chart-1))",
            },
            revenue: {
                label: t('adminPanel.overview.revenueLabel'),
                color: "hsl(var(--chart-2))",
            },
        }),
        [t]
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
                <JarLoader />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* The shop's net contents: one printed panel, four quantities,
                divided by rules rather than split into four bubble cards. */}
            <div className="plate grid grid-cols-2 divide-x divide-y divide-border lg:grid-cols-4 lg:divide-y-0">
                {[
                    { label: t('adminPanel.overview.users'), value: stats?.users ?? 0, Icon: Users },
                    { label: t('adminPanel.overview.activeAppointments'), value: stats?.activeAppointments ?? 0, Icon: Calendar },
                    { label: t('adminPanel.overview.allServices'), value: stats?.services ?? 0, Icon: Scissors },
                    {
                        label: t('adminPanel.overview.monthlyRevenue'),
                        value: stats?.revenue ? `${stats.revenue.toFixed(2)} PLN` : "0.00 PLN",
                        Icon: DollarSign,
                    },
                ].map(({ label, value, Icon }) => (
                    <div key={label} className="flex min-w-0 flex-col justify-between gap-5 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <p className="directions">{label}</p>
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                        </div>
                        <p className="net-line truncate text-2xl font-semibold lg:text-3xl">{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wykres godzinowy */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-primary" />
                            {t('adminPanel.overview.todayCompleted')}
                        </CardTitle>
                        <CardDescription>
                            {t('adminPanel.overview.todayChartDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingTodaysData && todaysHourlyData.length === 0 ? (
                            <div className="h-80 flex items-center justify-center">
                                <JarLoader />
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
                                                value: t('adminPanel.overview.hour'),
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
                                                value: t('adminPanel.overview.appointmentCount'),
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
                                                value: t('adminPanel.overview.revenueLabel'),
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
                                                        `${t('adminPanel.overview.hour')}: ${value}`
                                                    }
                                                    formatter={(value, name) => {
                                                        if (
                                                            name ===
                                                            t('adminPanel.overview.revenueLabel')
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
                                            iconType="square"
                                        />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="appointments"
                                            fill={
                                                todaysChartConfig.appointments
                                                    .color
                                            }
                                            radius={[0, 0, 0, 0]}
                                            name={t('adminPanel.overview.visitsByCount')}
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
                                            name={t('adminPanel.overview.revenueLabel')}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-muted-foreground text-center px-4">
                                <Info className="h-10 w-10 mb-2" />
                                {t('adminPanel.overview.noDataToday')}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Powiadomienia */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Bell className="h-5 w-5 mr-2 text-primary" />
                            {t('adminPanel.overview.notifications')}
                        </CardTitle>
                        <CardDescription>
                            {t('adminPanel.overview.latestNotifications')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NotificationDigest allHref="/admin-dashboard/notifications" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminOverview;
