import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCard } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { CalendarDays, FileText, TrendingUp, Users as UsersIcon, Clock } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { format, isValid as isValidDate, differenceInCalendarDays, parseISO } from "date-fns";
// Usunięto: import { DateRange } from "react-day-picker"; // Nie jest już potrzebne dla react-day-picker
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MuiCalendar from "@/components/ui/mui-calendar"; // Twój wrapper dla MUI DateCalendar
import { cn } from "@/lib/utils";
import dayjs, { Dayjs } from 'dayjs';

type TimeRangePreset = "1day" | "7days" | "1month" | "custom";
type ChartType = "line" | "bar" | "pie";

interface ReportDataItemBackend {
    date: string;
    appointments: number;
    revenue: number;
    barbers: { [barberName: string]: number };
}

interface ReportDataItemProcessed {
    date: string;
    appointments: number;
    revenue: number;
    barbers: { [barberName: string]: number };
    [barberKey: string]: string | number | { [barberName: string]: number };
}

interface CustomDateRangeState { // Zmieniamy nazwę dla jasności
    from: Date | null;
    to: Date | null;
}

const AdminReports = () => {
    const { token, loading: authLoading } = useAuth();
    const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>("7days");
    const [customDateRange, setCustomDateRange] = useState<CustomDateRangeState>({ from: null, to: null });
    const [chartType, setChartType] = useState<ChartType>("bar");
    const [reportData, setReportData] = useState<ReportDataItemProcessed[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const isMobile = useIsMobile();

    const displayChartType = isMobile ? "pie" : chartType;

    // useEffect i reszta logiki pobierania danych (fetchReportData) pozostaje taka sama,
    // ponieważ operuje na customDateRange.from i customDateRange.to
    useEffect(() => {
        if (authLoading) {
            setIsLoadingData(true);
            return;
        }
        if (!token && !authLoading) {
            setIsLoadingData(false);
            if (!authLoading) sonnerToast.error("Błąd autoryzacji. Zaloguj się ponownie.");
            setReportData([]);
            return;
        }

        const fetchReportData = async () => {
            if (!token) return;

            setIsLoadingData(true);
            let queryString = "";
            let validRange = false;

            if (timeRangePreset === "custom") {
                const { from, to } = customDateRange;
                if (from && to) {
                    if (from > to) {
                        sonnerToast.error("Data początkowa nie może być późniejsza niż data końcowa.");
                        setIsLoadingData(false);
                        setReportData([]);
                        return;
                    }
                    queryString = `timeRange=custom&startDate=${format(from, "yyyy-MM-dd")}&endDate=${format(to, "yyyy-MM-dd")}`;
                    validRange = true;
                } else {
                    setIsLoadingData(false);
                    setReportData([]);
                    return;
                }
            } else {
                queryString = `timeRange=${timeRangePreset}`;
                validRange = true;
            }

            if (!validRange) {
                setIsLoadingData(false);
                setReportData([]);
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/admin/reports-data?${queryString}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Nie udało się pobrać danych raportu" }));
                    throw new Error(errorData.error || "Nie udało się pobrać danych raportu");
                }
                const dataFromBackend: ReportDataItemBackend[] = await response.json();

                const processedForFrontend = dataFromBackend.map(item => {
                    const processedItem: ReportDataItemProcessed = {
                        date: item.date,
                        appointments: item.appointments,
                        revenue: item.revenue,
                        barbers: item.barbers,
                    };
                    if (item.barbers && typeof item.barbers === 'object') {
                        Object.entries(item.barbers).forEach(([barberName, count]) => {
                            const keyForChart = barberName.replace(/\s+/g, '_').toLowerCase();
                            processedItem[keyForChart] = count;
                        });
                    }
                    return processedItem;
                });
                setReportData(processedForFrontend);

            } catch (error: any) {
                sonnerToast.error(error.message || "Wystąpił błąd podczas ładowania raportów.");
                setReportData([]);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchReportData();
    }, [timeRangePreset, customDateRange, token, authLoading]);

    // chartConfig, totalAppointments, totalRevenue, avgAppointments, avgRevenue, pieData - bez zmian
    const chartConfig = useMemo(() => {
        const barberColors = ["#8b5a2b", "#a0692e", "#d4a574", "#C08B5C", "#A97142", "#E0B68A", "#7E4F23", "#C8925A"];
        const config: any = {
            appointments: { label: "Wizyty", color: "hsl(var(--chart-1))" },
            revenue: { label: "Przychód (PLN)", color: "hsl(var(--chart-2))" },
        };

        const allBarberDisplayNames = new Set<string>();
        reportData.forEach(item => {
            if (item.barbers && typeof item.barbers === 'object') {
                Object.keys(item.barbers).forEach(name => allBarberDisplayNames.add(name));
            }
        });

        Array.from(allBarberDisplayNames).forEach((barberName, index) => {
            const keyForChart = barberName.replace(/\s+/g, '_').toLowerCase();
            config[keyForChart] = {
                label: barberName,
                color: barberColors[index % barberColors.length]
            };
        });
        return config;
    }, [reportData]);

    const totalAppointments = useMemo(() => reportData.reduce((sum, item) => sum + item.appointments, 0), [reportData]);
    const totalRevenue = useMemo(() => reportData.reduce((sum, item) => sum + item.revenue, 0), [reportData]);
    const avgAppointments = useMemo(() => reportData.length > 0 ? Math.round(totalAppointments / reportData.length) : 0, [reportData, totalAppointments]);
    const avgRevenue = useMemo(() => reportData.length > 0 ? Math.round(totalRevenue / reportData.length) : 0, [reportData, totalRevenue]);

    const pieData = useMemo(() => {
        if (!reportData.length) return [];
        const aggregatedBarberData: { [name: string]: { name: string, value: number, color: string } } = {};

        const allBarberDisplayNames = new Set<string>();
        reportData.forEach(item => {
            if (item.barbers && typeof item.barbers === 'object') {
                Object.keys(item.barbers).forEach(name => allBarberDisplayNames.add(name));
            }
        });

        Array.from(allBarberDisplayNames).forEach(barberName => {
            const keyForChart = barberName.replace(/\s+/g, '_').toLowerCase();
            aggregatedBarberData[barberName] = {
                name: barberName,
                value: 0,
                color: chartConfig[keyForChart]?.color || '#CCCCCC'
            };
        });

        reportData.forEach(dailyEntry => {
            if (dailyEntry.barbers && typeof dailyEntry.barbers === 'object') {
                Object.entries(dailyEntry.barbers).forEach(([barberName, count]) => {
                    if (aggregatedBarberData[barberName]) {
                        aggregatedBarberData[barberName].value += count;
                    }
                });
            }
        });
        return Object.values(aggregatedBarberData).filter(item => item.value > 0);
    }, [reportData, chartConfig]);

    const handlePDFGeneration = () => {
        sonnerToast.info("Generowanie raportu PDF...", {
            description: "Funkcjonalność w przygotowaniu.",
        });
    };

    const getEffectiveTimeRangeTypeForXAxis = () => {
        if (timeRangePreset === 'custom' && customDateRange.from && customDateRange.to) {
            const diff = differenceInCalendarDays(customDateRange.to, customDateRange.from);
            return diff === 0 ? '1day' : 'other';
        }
        return timeRangePreset;
    };

    const renderChart = () => {
        if (isLoadingData) {
            return <div className="h-[300px] md:h-[400px] w-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-barber"></div></div>;
        }
        if (!reportData || reportData.length === 0) {
            return <div className="h-[300px] md:h-[400px] w-full flex items-center justify-center text-gray-500">Brak danych do wyświetlenia dla wybranego okresu.</div>;
        }
        const xAxisTimeRange = getEffectiveTimeRangeTypeForXAxis();

        if (displayChartType === "pie") {
            if (pieData.length === 0) return <div className="h-[300px] md:h-[400px] w-full flex items-center justify-center text-gray-500">Brak danych o wizytach barberów.</div>;
            return (
                <ChartContainer config={chartConfig} className={isMobile ? "h-[220px] w-full" : "h-[300px] md:h-[400px] w-full"}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 70 : 120} labelLine={false} label={isMobile ? false : ({ name, percent, value }) => `${name.split(' ')[0]}: ${value} (${(percent * 100).toFixed(0)}%)`}>
                                {pieData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.color} />))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            {!isMobile && <Legend verticalAlign="bottom" height={36} />}
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            );
        }
        if (displayChartType === "line") {
            return (
                <ChartContainer config={chartConfig} className="h-[300px] md:h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData} margin={{ left: 0, right: isMobile ? 15 : 30, top: 10, bottom: isMobile ? 50 : 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" fontSize={isMobile ? 9 : 12} angle={isMobile && xAxisTimeRange !== '1day' ? -60 : 0} textAnchor={isMobile && xAxisTimeRange !== '1day' ? "end" : "middle"} height={isMobile && xAxisTimeRange !== '1day' ? 60 : 30} interval="preserveStartEnd" />
                            <YAxis yAxisId="left" dataKey="appointments" name="Wizyty" fontSize={isMobile ? 9 : 12} allowDecimals={false}/>
                            <YAxis yAxisId="right" dataKey="revenue" name="Przychód (PLN)" orientation="right" fontSize={isMobile ? 9 : 12} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend verticalAlign="top" height={36} />
                            <Line yAxisId="left" type="monotone" dataKey="appointments" stroke={chartConfig.appointments.color} strokeWidth={2} name="Wizyty" dot={false} />
                            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={chartConfig.revenue.color} strokeWidth={2} name="Przychód (PLN)" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            );
        }
        const uniqueBarberKeysForChart = Object.keys(chartConfig).filter(key => key !== 'appointments' && key !== 'revenue');
        return (
            <ChartContainer config={chartConfig} className="h-[300px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData} margin={{ left: 0, right: 10, top: 10, bottom: isMobile ? 50 : 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={isMobile ? 9 : 12} angle={isMobile && xAxisTimeRange !== '1day' ? -60 : 0} textAnchor={isMobile && xAxisTimeRange !== '1day' ? "end" : "middle"} height={isMobile && xAxisTimeRange !== '1day' ? 60 : 30} interval="preserveStartEnd" />
                        <YAxis fontSize={isMobile ? 9 : 12} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend verticalAlign="top" height={36} />
                        {uniqueBarberKeysForChart.map(barberKey => (
                            <Bar key={barberKey} dataKey={barberKey} stackId="a" fill={chartConfig[barberKey]?.color || '#8884d8'} name={chartConfig[barberKey]?.label || barberKey} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        );
    };

    const renderMobileStatistics = () => {
        if (isLoadingData || !reportData || reportData.length === 0) return null;
        const topBarber = pieData.length > 0 ? pieData.reduce((prev, current) => (prev.value > current.value ? prev : current), pieData[0] || { name: "N/A", value: 0}) : { name: "N/A", value: 0 };
        const isCustomOneDayRange = timeRangePreset === 'custom' && customDateRange.from && customDateRange.to && differenceInCalendarDays(customDateRange.to, customDateRange.from) === 0;
        const recentGrowth = reportData.length > 1 && reportData[0].appointments > 0 ? ((reportData[reportData.length - 1].appointments - reportData[0].appointments) / reportData[0].appointments * 100) : 0;

        return (
            <div className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-2">
                    <Card className="p-3"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-barber" /><div><div className="text-xs text-gray-600">Wzrost wizyt</div><div className="font-bold text-sm">{recentGrowth > 0 ? '+' : ''}{recentGrowth.toFixed(1)}%</div></div></div></Card>
                    <Card className="p-3"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-barber" /><div><div className="text-xs text-gray-600">Śr. {timeRangePreset === '1day' || isCustomOneDayRange ? 'godz.' : 'dziennie'}</div><div className="font-bold text-sm">{avgAppointments} wizyt</div></div></div></Card>
                </div>
                <Card className="p-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-barber" /><div><div className="text-xs text-gray-600">Top Barber</div><div className="font-bold text-sm">{topBarber.name}</div></div></div><div className="text-right"><div className="font-bold text-barber">{topBarber.value}</div><div className="text-xs text-gray-600">wizyt</div></div></div></Card>
                <Card className="p-3">
                    <div className="text-sm font-medium mb-2">Rozkład wizyt (Top {Math.min(3, pieData.length)})</div>
                    <div className="space-y-2">
                        {pieData.slice(0, 3).map((barber) => {
                            const percentage = totalAppointments > 0 ? (barber.value / totalAppointments * 100) : 0;
                            return (<div key={barber.name} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: barber.color }} /><span className="text-xs">{barber.name}</span></div><div className="text-right"><div className="text-sm font-medium">{barber.value}</div><div className="text-xs text-gray-600">{percentage.toFixed(0)}%</div></div></div>);
                        })}
                    </div>
                </Card>
            </div>
        );
    };

    if (authLoading || isLoadingData) {
        return <div className="min-h-[calc(100vh-200px)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div></div>;
    }

    const isCustomOneDayRangeForTable = timeRangePreset === 'custom' && customDateRange.from && customDateRange.to && differenceInCalendarDays(customDateRange.to, customDateRange.from) === 0;


    return (
        <div className={isMobile ? "space-y-3 p-2" : "space-y-6 p-4"}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <FileText className="h-6 w-6 mr-2 text-barber" />
                        Raporty Statystyk
                    </CardTitle>
                    <CardDescription>Analizuj dane dotyczące wizyt i przychodów.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap sm:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row items-center sm:flex-wrap">
                        <Select
                            value={timeRangePreset}
                            onValueChange={(value: TimeRangePreset) => {
                                setTimeRangePreset(value);
                                if (value !== 'custom') {
                                    setCustomDateRange([null, null]);
                                }
                            }}
                        >
                            <SelectTrigger className={isMobile ? "w-full text-sm h-9" : "w-full sm:w-[170px]"}>
                                <SelectValue placeholder="Wybierz okres" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1day">Ostatnie 24h</SelectItem>
                                <SelectItem value="7days">Ostatnie 7 dni</SelectItem>
                                <SelectItem value="1month">Bieżący miesiąc</SelectItem>
                                <SelectItem value="custom">Niestandardowy</SelectItem>
                            </SelectContent>
                        </Select>

                        {timeRangePreset === 'custom' && (
                            <div className={cn("flex flex-col sm:flex-row gap-2 items-center", isMobile ? "w-full" : "sm:w-auto")}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("h-9 justify-start text-left font-normal", isMobile ? "w-full text-sm" : "w-[160px]", !customDateRange.from && "text-muted-foreground")}
                                        >
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            {customDateRange.from ? format(customDateRange.from, "dd LLL, y") : <span>Data od</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <MuiCalendar
                                            value={customDateRange.from}
                                            onChange={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                                            maxDate={customDateRange.to ? dayjs(customDateRange.to) : dayjs()} // Nie można wybrać daty "od" po dacie "do" lub po dzisiaj
                                            shouldDisableDate={(day) => day.isAfter(dayjs()) || (customDateRange.to ? day.isAfter(dayjs(customDateRange.to)) : false) }
                                        />
                                    </PopoverContent>
                                </Popover>
                                <span className="text-muted-foreground hidden sm:inline">-</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            disabled={!customDateRange.from} // Dezaktywuj, jeśli data "od" nie jest wybrana
                                            className={cn("h-9 justify-start text-left font-normal", isMobile ? "w-full text-sm" : "w-[160px]", !customDateRange.to && "text-muted-foreground")}
                                        >
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            {customDateRange.to ? format(customDateRange.to, "dd LLL, y") : <span>Data do</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <MuiCalendar
                                            value={customDateRange.to}
                                            onChange={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                                            minDate={customDateRange.from ? dayjs(customDateRange.from) : undefined}
                                            maxDate={dayjs()} // Nie można wybrać daty przyszłej
                                            shouldDisableDate={(day) => day.isAfter(dayjs()) || (customDateRange.from ? day.isBefore(dayjs(customDateRange.from)): false)}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        {!isMobile && (
                            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                                <SelectTrigger className="w-full sm:w-[220px] h-9">
                                    <SelectValue placeholder="Typ wykresu" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bar">Słupkowy (wizyty per barber)</SelectItem>
                                    <SelectItem value="line">Liniowy (wizyty i przychód)</SelectItem>
                                    <SelectItem value="pie">Kołowy (udział barberów)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <Button onClick={handlePDFGeneration} className={isMobile ? "w-full text-sm h-9 mt-2 sm:mt-0 sm:w-auto" : "h-9"} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />Generuj PDF
                    </Button>
                </CardContent>
            </Card>

            <div className={isMobile ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 lg:grid-cols-4 gap-4"}>
                <Card className={isMobile ? "p-0" : ""}><CardHeader className={isMobile ? "pb-1 pt-2 px-2" : "pb-2"}><CardTitle className={isMobile ? "text-xs" : "text-sm font-medium"}>Łączne wizyty</CardTitle></CardHeader><CardContent className={isMobile ? "pt-0 px-2 pb-2" : "pt-0"}><div className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>{totalAppointments}</div></CardContent></Card>
                <Card className={isMobile ? "p-0" : ""}><CardHeader className={isMobile ? "pb-1 pt-2 px-2" : "pb-2"}><CardTitle className={isMobile ? "text-xs" : "text-sm font-medium"}>Łączny przychód</CardTitle></CardHeader><CardContent className={isMobile ? "pt-0 px-2 pb-2 flex items-baseline gap-1" : "pt-0 flex items-baseline gap-1"}><div className={isMobile ? "text-lg font-bold" : "text-2xl font-bold"}>{totalRevenue.toLocaleString()}</div> <span className="text-xs text-muted-foreground">PLN</span></CardContent></Card>
                <Card className={isMobile ? "p-0" : ""}><CardHeader className={isMobile ? "pb-1 pt-2 px-2" : "pb-2"}><CardTitle className={isMobile ? "text-xs" : "text-sm font-medium"}>Średnio wizyt</CardTitle></CardHeader><CardContent className={isMobile ? "pt-0 px-2 pb-2" : "pt-0"}><div className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>{avgAppointments}</div></CardContent></Card>
                <Card className={isMobile ? "p-0" : ""}><CardHeader className={isMobile ? "pb-1 pt-2 px-2" : "pb-2"}><CardTitle className={isMobile ? "text-xs" : "text-sm font-medium"}>Średnio przychód</CardTitle></CardHeader><CardContent className={isMobile ? "pt-0 px-2 pb-2 flex items-baseline gap-1" : "pt-0 flex items-baseline gap-1"}><div className={isMobile ? "text-lg font-bold" : "text-2xl font-bold"}>{avgRevenue.toLocaleString()}</div> <span className="text-xs text-muted-foreground">PLN</span></CardContent></Card>
            </div>

            {isMobile ? renderMobileStatistics() : (
                <Card>
                    <CardHeader><CardTitle>{displayChartType === "pie" ? "Udział wizyt barberów" : displayChartType === "line" ? "Trend wizyt i przychodów" : "Liczba wizyt per barber"}</CardTitle></CardHeader>
                    <CardContent className="p-2 md:p-4">{renderChart()}</CardContent>
                </Card>
            )}

            {!isMobile && (
                <Card>
                    <CardHeader><CardTitle>Szczegółowe dane</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{(timeRangePreset === "1day" || isCustomOneDayRangeForTable) ? "Godzina" : "Data"}</TableHead>
                                        <TableHead className="text-right">Łączne wizyty</TableHead>
                                        <TableHead className="text-right">Przychód (PLN)</TableHead>
                                        {pieData.map(p => <TableHead key={`header-${p.name}`} className="text-right">{p.name}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.date}</TableCell>
                                            <TableCell className="text-right"><Badge variant="secondary">{item.appointments}</Badge></TableCell>
                                            <TableCell className="text-right font-medium">{item.revenue.toLocaleString()}</TableCell>
                                            {pieData.map(p => {
                                                const barberKey = p.name.replace(/\s+/g, '_').toLowerCase();
                                                return <TableCell key={`cell-${p.name}-${index}`} className="text-right">{(item[barberKey] as number || 0)}</TableCell>;
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AdminReports;