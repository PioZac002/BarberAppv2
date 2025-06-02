// src/pages/admin-dashboard/AdminReports.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCard } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { CalendarDays, FileText, TrendingUp, Users as UsersIcon, Clock, Loader2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { format, isValid as isValidDate, differenceInCalendarDays, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MuiCalendar from "@/components/ui/mui-calendar";
import { cn } from "@/lib/utils";
import dayjs, { Dayjs } from 'dayjs';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface CustomDateRangeState {
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

    const reportContentRef = useRef<HTMLDivElement>(null);

    const displayChartType = isMobile ? "pie" : chartType;

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

            if (!validRange && timeRangePreset === 'custom') {
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

        if (token) {
            fetchReportData();
        } else if (!authLoading) {
            setIsLoadingData(false);
        }
    }, [timeRangePreset, customDateRange, token, authLoading]);

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

    const handlePDFGeneration = async () => {
        const input = reportContentRef.current;
        if (input) {
            sonnerToast.info("Generating PDF report...", {
                description: "This may take a few moments.",
            });
            try {
                const elementsToHide = input.querySelectorAll('.print\\:hidden');
                elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');

                const elementsToShow = input.querySelectorAll('.print\\:block');
                elementsToShow.forEach(el => (el as HTMLElement).style.display = 'block');

                const canvas = await html2canvas(input, {
                    scale: 1.5,
                    useCORS: true,
                });

                elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
                elementsToShow.forEach(el => (el as HTMLElement).style.display = 'none');

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgProps = pdf.getImageProperties(imgData);
                const imgWidth = imgProps.width;
                const imgHeight = imgProps.height;

                const ratio = imgWidth / imgHeight;
                const margin = 30;
                let newImgWidth = pdfWidth - 2 * margin;
                let newImgHeight = newImgWidth / ratio;

                const pageHeight = pdf.internal.pageSize.getHeight() - 2 * margin;

                if (newImgHeight > pageHeight) {
                    newImgHeight = pageHeight;
                    newImgWidth = newImgHeight * ratio;
                }

                const x = (pdfWidth - newImgWidth) / 2;
                let y = margin; // Zmieniono na y, aby było jasne

                // Tytuł i zakres dat są już w divie #pdf-report-header, który jest częścią reportContentRef

                pdf.addImage(imgData, 'PNG', x, y, newImgWidth, newImgHeight);

                let dateRangeString = "";
                if (timeRangePreset === "custom" && customDateRange.from && customDateRange.to) {
                    dateRangeString = `from_${format(customDateRange.from, "yyyyMMdd")}_to_${format(customDateRange.to, "yyyyMMdd")}`;
                } else {
                    dateRangeString = timeRangePreset;
                }
                pdf.save(`BarberShop_Report_${dateRangeString}.pdf`);
                sonnerToast.success("PDF Report generated successfully!");

            } catch (error) {
                console.error("Error generating PDF:", error);
                sonnerToast.error("Failed to generate PDF report. See console for details.");
            }
        } else {
            sonnerToast.error("Report content element not found.");
        }
    };

    const getEffectiveTimeRangeTypeForXAxisInternal = () => {
        if (timeRangePreset === 'custom' && customDateRange.from && customDateRange.to) {
            const diff = differenceInCalendarDays(customDateRange.to, customDateRange.from);
            return diff === 0 ? '1day' : 'other';
        }
        return timeRangePreset;
    };

    const renderChartInternal = () => {
        if (isLoadingData) { return <div className="h-[300px] md:h-[400px] w-full flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-barber"/></div>; }
        if (!reportData || reportData.length === 0) { return <div className="h-[300px] md:h-[400px] w-full flex items-center justify-center text-gray-500">Brak danych do wyświetlenia dla wybranego okresu.</div>; }
        const xAxisTimeRange = getEffectiveTimeRangeTypeForXAxisInternal();

        if (displayChartType === "pie") {
            if (pieData.length === 0) return <div className="h-[300px] md:h-[400px] w-full flex items-center justify-center text-gray-500">Brak danych o wizytach barberów.</div>;
            return (
                <ChartContainer config={chartConfig} className={isMobile ? "h-[220px] w-full" : "h-[300px] md:h-[400px] w-full"}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 70 : 120} labelLine={false} label={isMobile ? false : ({ name, percent, value }) => `${name.split(' ')[0]}: ${value} (${(percent * 100).toFixed(0)}%)`}>
                                {pieData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.color} />))}
                            </Pie>
                            <RechartsTooltip content={<ChartTooltipContent hideLabel />} />
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
                            <RechartsTooltip content={<ChartTooltipContent />} />
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
                        <RechartsTooltip content={<ChartTooltipContent />} />
                        <Legend verticalAlign="top" height={36} />
                        {uniqueBarberKeysForChart.map(barberKey => (
                            <Bar key={barberKey} dataKey={barberKey} stackId="a" fill={chartConfig[barberKey]?.color || '#8884d8'} name={chartConfig[barberKey]?.label || barberKey} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        );
    };

    const renderMobileStatisticsInternal = () => { /* ... bez zmian ... */ return <></>};

    if (authLoading || isLoadingData) {
        return <div className="min-h-[calc(100vh-200px)] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-barber"/></div>;
    }

    const isCustomOneDayRangeForTable = timeRangePreset === 'custom' && customDateRange.from && customDateRange.to && differenceInCalendarDays(customDateRange.to, customDateRange.from) === 0;

    return (
        <div className={isMobile ? "space-y-3 p-2" : "space-y-6 p-4"}>
            <Card className="print:hidden">
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
                                        <Button variant={"outline"} className={cn("h-9 justify-start text-left font-normal", isMobile ? "w-full text-sm" : "w-[160px]", !customDateRange.from && "text-muted-foreground")}>
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            {customDateRange.from ? format(customDateRange.from, "dd LLL, y") : <span>Data od</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <MuiCalendar value={customDateRange.from} onChange={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))} maxDate={customDateRange.to ? dayjs(customDateRange.to) : dayjs()} shouldDisableDate={(day) => day.isAfter(dayjs()) || (customDateRange.to ? day.isAfter(dayjs(customDateRange.to)) : false) } />
                                    </PopoverContent>
                                </Popover>
                                <span className="text-muted-foreground hidden sm:inline">-</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} disabled={!customDateRange.from} className={cn("h-9 justify-start text-left font-normal", isMobile ? "w-full text-sm" : "w-[160px]", !customDateRange.to && "text-muted-foreground")}>
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            {customDateRange.to ? format(customDateRange.to, "dd LLL, y") : <span>Data do</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <MuiCalendar value={customDateRange.to} onChange={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))} minDate={customDateRange.from ? dayjs(customDateRange.from) : undefined} maxDate={dayjs()} shouldDisableDate={(day) => day.isAfter(dayjs()) || (customDateRange.from ? day.isBefore(dayjs(customDateRange.from)): false)} />
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
                    <Button onClick={handlePDFGeneration} className={isMobile ? "w-full text-sm h-9 mt-2 sm:mt-0 sm:w-auto print:hidden" : "h-9 print:hidden"} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />Generuj PDF
                    </Button>
                </CardContent>
            </Card>

            <div ref={reportContentRef} id="report-to-print-content" className="report-content-for-pdf bg-white p-4 print:!p-0 print:shadow-none print:border-none space-y-6">
                <div id="pdf-header-placeholder" className="hidden print:block text-center py-4 mb-4 border-b"> {/* Zmieniono ID */}
                    <h1 className="text-xl font-bold text-gray-800">Raport Przychodów i Ilości Wizyt</h1>
                    <p className="text-sm text-gray-600">
                        Zakres dat: {
                        timeRangePreset === 'custom' && customDateRange.from && customDateRange.to
                            ? `${format(customDateRange.from, "dd.MM.yyyy")} - ${format(customDateRange.to, "dd.MM.yyyy")}`
                            : `${timeRangePreset.replace('1day', 'Ostatnie 24h').replace('7days', 'Ostatnie 7 dni').replace('1month', 'Bieżący miesiąc')}`
                    }
                    </p>
                </div>

                <div className={isMobile ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 lg:grid-cols-4 gap-4"}>
                    <Card className="print:border print:shadow-sm"><CardHeader className="pb-1 pt-2 px-3"><CardTitle className="text-xs font-medium text-muted-foreground">Łączne wizyty</CardTitle></CardHeader><CardContent className="pt-0 px-3 pb-2"><div className="text-xl font-bold">{totalAppointments}</div></CardContent></Card>
                    <Card className="print:border print:shadow-sm"><CardHeader className="pb-1 pt-2 px-3"><CardTitle className="text-xs font-medium text-muted-foreground">Łączny przychód</CardTitle></CardHeader><CardContent className="pt-0 px-3 pb-2 flex items-baseline gap-1"><div className="text-xl font-bold">{totalRevenue.toLocaleString()}</div> <span className="text-xs text-muted-foreground">PLN</span></CardContent></Card>
                    <Card className="print:border print:shadow-sm"><CardHeader className="pb-1 pt-2 px-3"><CardTitle className="text-xs font-medium text-muted-foreground">Średnio wizyt</CardTitle></CardHeader><CardContent className="pt-0 px-3 pb-2"><div className="text-xl font-bold">{avgAppointments}</div></CardContent></Card>
                    <Card className="print:border print:shadow-sm"><CardHeader className="pb-1 pt-2 px-3"><CardTitle className="text-xs font-medium text-muted-foreground">Średnio przychód</CardTitle></CardHeader><CardContent className="pt-0 px-3 pb-2 flex items-baseline gap-1"><div className="text-xl font-bold">{avgRevenue.toLocaleString()}</div> <span className="text-xs text-muted-foreground">PLN</span></CardContent></Card>
                </div>

                <Card className="mt-4 print:block print:shadow-none print:border-none">
                    <CardHeader className="print:hidden">
                        <CardTitle>
                            {isMobile ? "Podział wizyt (mobilne)" :
                                displayChartType === "pie" ? "Udział wizyt barberów" :
                                    displayChartType === "line" ? "Trend wizyt i przychodów" :
                                        "Liczba wizyt per barber"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-2 md:p-4">
                        <div className="print-chart-for-pdf">
                            <ChartContainer config={chartConfig} className="h-[280px] sm:h-[300px] md:h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportData} margin={{ top: 20, right: 20, bottom: (isMobile && getEffectiveTimeRangeTypeForXAxisInternal() !== '1day') ? 70 : 50, left: -15 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" fontSize={isMobile ? 8 : 10} angle={(isMobile && getEffectiveTimeRangeTypeForXAxisInternal() !== '1day') ? -70 : 0} textAnchor={(isMobile && getEffectiveTimeRangeTypeForXAxisInternal() !== '1day') ? "end" : "middle"} height={(isMobile && getEffectiveTimeRangeTypeForXAxisInternal() !== '1day') ? 70 : 40} interval="preserveStartEnd" />
                                        <YAxis fontSize={isMobile ? 8 : 10} allowDecimals={false} />
                                        <RechartsTooltip wrapperStyle={{ fontSize: '10px' }} content={<ChartTooltipContent />} />
                                        <Legend verticalAlign="top" height={30} wrapperStyle={{fontSize: "10px"}}/>
                                        {Object.keys(chartConfig).filter(key => key !== 'appointments' && key !== 'revenue').map(barberKey => (
                                            <Bar key={barberKey} dataKey={barberKey} stackId="a" fill={chartConfig[barberKey]?.color || '#8884d8'} name={chartConfig[barberKey]?.label || barberKey} radius={[2,2,0,0]}/>
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                        <div className="print:hidden">
                            {isMobile ? renderMobileStatisticsInternal() : renderChartInternal()}
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-4 print:shadow-none print:border-none">
                    <CardHeader className="print:hidden"><CardTitle>Szczegółowe dane</CardTitle></CardHeader>
                    <CardContent className="print:pt-4">
                        <div className="overflow-x-auto">
                            <Table className="text-xs sm:text-sm min-w-[600px] print:min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="print:text-[8pt] print:p-0.5">{(timeRangePreset === "1day" || isCustomOneDayRangeForTable) ? "Godz." : "Data"}</TableHead>
                                        <TableHead className="text-right print:text-[8pt] print:p-0.5">Wizyty</TableHead>
                                        <TableHead className="text-right print:text-[8pt] print:p-0.5">Przychód (PLN)</TableHead>
                                        {pieData.map(p => <TableHead key={`header-${p.name}`} className="text-right print:text-[8pt] print:p-0.5">{p.name.split(' ')[0]}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium print:text-[7pt] print:p-0.5">{item.date}</TableCell>
                                            <TableCell className="text-right print:text-[7pt] print:p-0.5"><Badge variant="secondary" className="text-xs print:text-[6pt] print:px-0.5 print:py-0">{item.appointments}</Badge></TableCell>
                                            <TableCell className="text-right font-medium print:text-[7pt] print:p-0.5">{item.revenue.toLocaleString()}</TableCell>
                                            {pieData.map(p => {
                                                const barberKey = p.name.replace(/\s+/g, '_').toLowerCase();
                                                return <TableCell key={`cell-${p.name}-${index}`} className="text-right print:text-[7pt] print:p-0.5">{(item[barberKey] as number || 0)}</TableCell>;
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminReports;