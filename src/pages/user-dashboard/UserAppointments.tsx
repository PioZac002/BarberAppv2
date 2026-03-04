import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    User,
    Edit,
    Trash2,
    Plus,
    ListFilter,
    Info,
    Star,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { isValid, format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface Appointment {
    id: number;
    service: string;
    barber: string;
    date: string;
    time: string;
    status: string;
    duration: string;
    price: string;
    appointment_timestamp: string;
}

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case "confirmed": return "bg-green-100 text-green-800";
        case "pending": return "bg-yellow-100 text-yellow-800";
        case "completed": return "bg-blue-100 text-blue-800";
        case "canceled":
        case "cancelled": return "bg-red-100 text-red-800";
        case "no-show": return "bg-orange-100 text-orange-800";
        default: return "bg-gray-100 text-gray-800";
    }
};

const formatPricePln = (price: string) => {
    const value = parseFloat(price);
    if (isNaN(value)) return price;
    return `${value.toFixed(2)} PLN`;
};

const UserAppointments = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    useRequireAuth({ allowedRoles: ["client"] });
    const { t, lang } = useLanguage();
    const dateLocale = lang === "pl" ? pl : enUS;

    const [appointmentList, setAppointmentList] = useState<Appointment[]>([]);
    const [filter, setFilter] = useState("all");
    const [isDataLoading, setIsDataLoading] = useState(true);

    const getStatusLabel = (status: string) => {
        switch (status.toLowerCase()) {
            case "confirmed": return t("userPanel.appointments.confirmed");
            case "pending":   return t("userPanel.appointments.pending");
            case "completed": return t("userPanel.appointments.completed");
            case "canceled":
            case "cancelled": return t("userPanel.appointments.cancelled");
            case "no-show":   return t("userPanel.appointments.noShow");
            default: return status;
        }
    };

    const getFilterLabel = (status: string) => {
        switch (status) {
            case "all":       return t("userPanel.appointments.all");
            case "confirmed": return t("userPanel.appointments.confirmed");
            case "pending":   return t("userPanel.appointments.pending");
            case "completed": return t("userPanel.appointments.completed");
            case "canceled":  return t("userPanel.appointments.cancelled");
            case "no-show":   return t("userPanel.appointments.noShow");
            default: return status;
        }
    };

    useEffect(() => {
        if (authContextLoading) {
            setIsDataLoading(true);
            return;
        }

        if (!token || !authUser) {
            setIsDataLoading(false);
            setAppointmentList([]);
            return;
        }

        const fetchAppointments = async () => {
            setIsDataLoading(true);
            let url = `${import.meta.env.VITE_API_URL}/api/user/appointments`;
            if (filter !== "all") {
                url += `?status=${filter}`;
            }

            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    let errorMsg = t("userPanel.appointments.loadFailed");
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) { /* ignore */ }
                    throw new Error(errorMsg);
                }
                const data: Appointment[] = await response.json();
                data.sort(
                    (a, b) =>
                        new Date(b.appointment_timestamp).getTime() -
                        new Date(a.appointment_timestamp).getTime()
                );
                setAppointmentList(data);
            } catch (error: any) {
                toast.error(error.message || t("userPanel.appointments.loadFailed"));
                setAppointmentList([]);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchAppointments();
    }, [authUser, token, filter, authContextLoading]);

    const handleCancelAppointment = async (id: number) => {
        if (!token) {
            toast.error(t("userPanel.appointments.authError"));
            return;
        }
        const confirmMsg = lang === "pl"
            ? "Czy na pewno chcesz anulować tę wizytę?"
            : "Are you sure you want to cancel this appointment?";
        if (!window.confirm(confirmMsg)) return;

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/user/appointments/${id}/cancel`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: t("userPanel.appointments.cancelFailed") }));
                throw new Error(errorData.error || t("userPanel.appointments.cancelFailed"));
            }
            setAppointmentList(prev =>
                prev
                    .map(appointment =>
                        appointment.id === id
                            ? { ...appointment, status: "canceled" }
                            : appointment
                    )
                    .sort(
                        (a, b) =>
                            new Date(b.appointment_timestamp).getTime() -
                            new Date(a.appointment_timestamp).getTime()
                    )
            );
            toast.success(t("userPanel.appointments.cancelledSuccess"));
        } catch (error: any) {
            toast.error(error.message || t("userPanel.appointments.cancelFailed"));
        }
    };

    if (authContextLoading || isDataLoading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    if (!authContextLoading && !authUser) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">
                    {t("userPanel.authErrorDesc")}
                </p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                    <Link to="/login">{t("userPanel.goToLogin")}</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">{t("userPanel.appointments.title")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("userPanel.appointments.subtitle")}
                    </p>
                </div>
                <Button asChild className="bg-barber hover:bg-barber-muted w-full sm:w-auto">
                    <Link to="/booking">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("userPanel.appointments.bookNew")}
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
                <Label
                    htmlFor="status-filter"
                    className="text-sm font-medium flex items-center whitespace-nowrap"
                >
                    <ListFilter className="h-4 w-4 mr-1.5 text-muted-foreground" />
                    {t("userPanel.appointments.filterByStatus")}
                </Label>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-full sm:w-[220px]" id="status-filter">
                        <SelectValue placeholder={t("userPanel.appointments.all")} />
                    </SelectTrigger>
                    <SelectContent>
                        {["all", "confirmed", "pending", "completed", "canceled", "no-show"].map(
                            (status) => (
                                <SelectItem key={status} value={status}>
                                    {getFilterLabel(status)}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {appointmentList.length > 0 ? (
                    appointmentList.map((appointment) => (
                        <Card
                            key={appointment.id}
                            className="hover:shadow-lg transition-shadow duration-200"
                        >
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-1">
                                            <h3 className="font-semibold text-md sm:text-lg text-foreground">
                                                {appointment.service}
                                            </h3>
                                            <Badge
                                                className={`${getStatusColor(appointment.status)} text-xs sm:text-sm`}
                                            >
                                                {getStatusLabel(appointment.status)}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground pt-1">
                                            <div className="flex items-center">
                                                <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                <span>{t("userPanel.appointments.barberLabel")}{appointment.barber}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                <span>
                                                    {isValid(new Date(appointment.date))
                                                        ? format(new Date(appointment.date), "PPP", { locale: dateLocale })
                                                        : t("userPanel.appointments.invalidDate")}
                                                </span>
                                            </div>
                                            <div className="flex items-center sm:col-span-2">
                                                <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                <span>{appointment.time} ({appointment.duration})</span>
                                            </div>
                                        </div>

                                        <div className="text-md sm:text-lg font-semibold text-barber pt-1">
                                            {formatPricePln(appointment.price)}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 mt-2 lg:mt-0 lg:ml-4 shrink-0 w-full sm:w-auto lg:w-[170px]">
                                        {(appointment.status.toLowerCase() === "confirmed" ||
                                            appointment.status.toLowerCase() === "pending") && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCancelAppointment(appointment.id)}
                                                className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" />
                                                {t("userPanel.appointments.cancelAppointment")}
                                            </Button>
                                        )}
                                        {appointment.status.toLowerCase() === "confirmed" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="w-full border-barber text-barber hover:bg-barber/10"
                                            >
                                                <Edit className="h-4 w-4 mr-1.5" />
                                                {t("userPanel.appointments.reschedule")}
                                            </Button>
                                        )}
                                        {appointment.status.toLowerCase() === "completed" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="w-full border-barber text-barber hover:bg-barber/10"
                                            >
                                                <Star className="h-4 w-4 mr-1.5" />
                                                {t("userPanel.appointments.addReview")}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-1">
                                {t("userPanel.appointments.noAppointments")}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {filter === "all"
                                    ? t("userPanel.appointments.noAppointmentsYet")
                                    : `${t("userPanel.appointments.noAppointmentsFilter")} ${getFilterLabel(filter).toLowerCase()}.`}
                            </p>
                            <Button asChild className="bg-barber hover:bg-barber-muted">
                                <Link to="/booking">{t("userPanel.appointments.bookFirst")}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default UserAppointments;
