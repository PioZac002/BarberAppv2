// src/pages/barber-dashboard/BarberAppointments.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CalendarDays as CalendarIcon,
    Filter,
    CheckCircle2,
    XCircle,
    ThumbsUp,
    UserX,
    Info,
    Phone,
    Scissors,
    Clock,
    DollarSign,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lot } from "@/components/szlif/Bits";
import { toast } from "sonner";
import { isValid, format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDateLocale } from "@/hooks/useDateLocale";
import { JarLoader } from "@/components/szlif/Loading";

interface Appointment {
    id: number;
    client_name: string;
    client_phone: string;
    service_name: string;
    price: number | string;
    appointment_time: string;
    status: string;
}

// Same stamp vocabulary as every other panel: the line style is the state.
const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    confirmed:  { bg: "stamp stamp--confirmed", text: "", dot: "bg-primary" },
    completed:  { bg: "stamp stamp--done",      text: "", dot: "bg-foreground/70" },
    cancelled:  { bg: "stamp stamp--void",      text: "", dot: "bg-destructive" },
    canceled:   { bg: "stamp stamp--void",      text: "", dot: "bg-destructive" },
    pending:    { bg: "stamp stamp--pending",   text: "", dot: "bg-muted-foreground" },
    "no-show":  { bg: "stamp stamp--absent",    text: "", dot: "bg-destructive" },
};

const BarberAppointmentsPage = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    const { t } = useLanguage();
    const dateLocale = useDateLocale();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        if (authContextLoading) { setIsLoadingData(true); return; }
        if (!authUser || !token) { setIsLoadingData(false); setAppointments([]); return; }

        const fetchAppointments = async () => {
            setIsLoadingData(true);
            let url = `${import.meta.env.VITE_API_URL}/api/barber/appointments`;
            const params = new URLSearchParams();
            if (timeFilter !== "all") params.append("upcoming", timeFilter === "upcoming" ? "true" : "false");
            if (params.toString()) url += `?${params.toString()}`;

            try {
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: t("barberPanel.appointments.loadFailed") }));
                    throw new Error(err.error || t("barberPanel.appointments.loadFailed"));
                }
                const data: Appointment[] = await res.json();
                data.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
                setAppointments(data);
            } catch (error: any) {
                toast.error(error.message || t("barberPanel.appointments.loadFailed"));
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchAppointments();
    }, [authUser, token, timeFilter, authContextLoading]);

    const getStatusLabel = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":   return t("barberPanel.appointments.pending");
            case "confirmed": return t("barberPanel.appointments.confirmed");
            case "completed": return t("barberPanel.appointments.completed");
            case "canceled":
            case "cancelled": return t("barberPanel.appointments.cancelled");
            case "no-show":   return t("barberPanel.appointments.noShow");
            default:          return status;
        }
    };

    const filteredAppointments = appointments.filter(a =>
        statusFilter === "all" || a.status.toLowerCase() === statusFilter.toLowerCase()
    );

    const handleStatusChange = async (appointmentId: number, newStatus: string) => {
        if (!token) { toast.error(t("barberPanel.appointments.authError")); return; }
        setUpdatingId(appointmentId);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/barber/appointments/${appointmentId}/status`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ status: newStatus }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: t("barberPanel.appointments.updateFailed") }));
                throw new Error(err.error || t("barberPanel.appointments.updateFailed"));
            }
            setAppointments(prev =>
                prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a)
                    .sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime())
            );
            toast.success(`${t("barberPanel.appointments.statusUpdated")} ${getStatusLabel(newStatus)}`);
        } catch (error: any) {
            toast.error(error.message || t("barberPanel.appointments.updateFailed"));
        } finally {
            setUpdatingId(null);
        }
    };

    if (authContextLoading || isLoadingData) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <JarLoader />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header card with filters */}
            <Card>
                <CardHeader className="border-b pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center text-xl sm:text-2xl">
                                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary" />
                                {t("barberPanel.appointments.title")}
                            </CardTitle>
                            <CardDescription className="mt-1">{t("barberPanel.appointments.subtitle")}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                            <Select value={timeFilter} onValueChange={setTimeFilter}>
                                <SelectTrigger className="w-36 h-9 text-sm">
                                    <SelectValue placeholder={t("barberPanel.appointments.filterByTime")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("barberPanel.appointments.allTimes")}</SelectItem>
                                    <SelectItem value="upcoming">{t("barberPanel.appointments.upcoming")}</SelectItem>
                                    <SelectItem value="past">{t("barberPanel.appointments.past")}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40 h-9 text-sm">
                                    <SelectValue placeholder={t("barberPanel.appointments.filterByStatus")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("barberPanel.appointments.allStatuses")}</SelectItem>
                                    <SelectItem value="pending">{t("barberPanel.appointments.pending")}</SelectItem>
                                    <SelectItem value="confirmed">{t("barberPanel.appointments.confirmed")}</SelectItem>
                                    <SelectItem value="completed">{t("barberPanel.appointments.completed")}</SelectItem>
                                    <SelectItem value="canceled">{t("barberPanel.appointments.cancelled")}</SelectItem>
                                    <SelectItem value="no-show">{t("barberPanel.appointments.noShow")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Appointments list */}
            {filteredAppointments.length === 0 ? (
                <div className="text-center py-16">
                    <CalendarIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">{t("barberPanel.appointments.noAppointments")}</h3>
                    <p className="text-muted-foreground">
                        {statusFilter === "all" && timeFilter === "all"
                            ? t("barberPanel.appointments.noAppointmentsDesc")
                            : t("barberPanel.appointments.noAppointmentsFilter")}
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filteredAppointments.map(appointment => {
                        const cfg = statusConfig[appointment.status.toLowerCase()] ?? statusConfig["pending"];
                        const isUpdating = updatingId === appointment.id;
                        const aptDate = new Date(appointment.appointment_time);
                        const validDate = isValid(aptDate);

                        return (
                            <Card
                                key={appointment.id}
                                className="overflow-hidden transition-shadow hover:shadow-plate"
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {/* Left accent bar */}

                                    <div className="flex-1 p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                            {/* Client & service info */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-foreground text-base">
                                                        {appointment.client_name}
                                                    </h3>
                                                    <Lot value={appointment.id} />
                                                    <span className={cfg.bg}>
                                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5`} />
                                                        {getStatusLabel(appointment.status)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Scissors className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                                        <span className="truncate">{appointment.service_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                                        <span>
                                                            {validDate
                                                                ? format(aptDate, "PP", { locale: dateLocale })
                                                                : t("barberPanel.appointments.invalidDate")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                                        <span>
                                                            {validDate
                                                                ? format(aptDate, "p", { locale: dateLocale })
                                                                : "—"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                                        <span className="font-medium text-foreground">
                                                            {parseFloat(String(appointment.price)).toFixed(2)} PLN
                                                        </span>
                                                    </div>
                                                </div>

                                                {appointment.client_phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{appointment.client_phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-col sm:items-end">
                                                {appointment.status === "pending" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            disabled={isUpdating}
                                                            onClick={() => handleStatusChange(appointment.id, "confirmed")}
                                                            className="h-8 gap-1.5 px-3 text-[0.6875rem]"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            {t("barberPanel.appointments.confirm")}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            disabled={isUpdating}
                                                            variant="outline"
                                                            onClick={() => handleStatusChange(appointment.id, "canceled")}
                                                            className="h-8 gap-1.5 border-destructive px-3 text-[0.6875rem] text-destructive hover:border-destructive hover:before:bg-destructive"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            {t("barberPanel.appointments.cancel")}
                                                        </Button>
                                                    </>
                                                )}
                                                {appointment.status === "confirmed" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            disabled={isUpdating}
                                                            onClick={() => handleStatusChange(appointment.id, "completed")}
                                                            className="h-8 gap-1.5 px-3 text-[0.6875rem]"
                                                        >
                                                            <ThumbsUp className="h-3.5 w-3.5" />
                                                            {t("barberPanel.appointments.complete")}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            disabled={isUpdating}
                                                            variant="outline"
                                                            onClick={() => handleStatusChange(appointment.id, "no-show")}
                                                            className="h-8 gap-1.5 border-destructive px-3 text-[0.6875rem] text-destructive hover:border-destructive hover:before:bg-destructive"
                                                        >
                                                            <UserX className="h-3.5 w-3.5" />
                                                            {t("barberPanel.appointments.markNoShow")}
                                                        </Button>
                                                    </>
                                                )}
                                                {(appointment.status === "completed" || appointment.status === "cancelled" || appointment.status === "canceled" || appointment.status === "no-show") && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                                                        <Info className="h-3.5 w-3.5" />
                                                        <span>{getStatusLabel(appointment.status)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BarberAppointmentsPage;
