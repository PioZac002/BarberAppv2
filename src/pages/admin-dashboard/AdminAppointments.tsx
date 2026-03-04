import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MuiCalendar from "@/components/ui/mui-calendar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, X, Calendar as CalendarIcon, RotateCcw, User, Scissors, Clock, DollarSign } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";

// --- Typy i schematy ---
interface Appointment {
    id: number;
    appointment_time: string;
    status: string;
    client_first_name: string;
    client_last_name: string;
    barber_first_name: string;
    barber_last_name: string;
    service_name: string;
    service_price: number;
    created_at: string;
    client_id: number;
    barber_id: number;
    service_id: number;
}

interface SelectOption {
    id: number;
    first_name: string;
    last_name: string;
}

interface ServiceOption {
    id: number;
    name: string;
}

const appointmentFormSchema = z.object({
    client_id: z.string().min(1, "Wymagane wskazanie klienta"),
    barber_id: z.string().min(1, "Wymagane wskazanie barbera"),
    service_id: z.string().min(1, "Wymagane wskazanie usługi"),
    appointment_date: z.date({ required_error: "Date is required." }),
    appointment_time: z.string().regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Niepoprawny format czasu (HH:mm)"
    ),
    status: z.enum(["pending", "confirmed", "completed", "canceled", "no-show"]),
});

// --- helper do formatu daty bez UTC ---
const formatDateLocalYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

// --- Status config ---
const statusConfig: Record<string, { dot: string; badge: string; label?: string }> = {
    pending:   { dot: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700" },
    confirmed: { dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700" },
    completed: { dot: "bg-green-500",  badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700" },
    canceled:  { dot: "bg-red-500",    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700" },
    "no-show": { dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600" },
};

const StatusBadge = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] ?? statusConfig["pending"];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {status}
        </span>
    );
};

// --- Komponent główny ---
const AdminAppointments = () => {
    const { t, lang } = useLanguage();
    const dateLocale = lang === 'pl' ? pl : enUS;
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<SelectOption[]>([]);
    const [barbers, setBarbers] = useState<SelectOption[]>([]);
    const [services, setServices] = useState<ServiceOption[]>([]);

    const [filters, setFilters] = useState<{
        status: string;
        clientId: string;
        barberId: string;
        serviceId: string;
        date: Date | null;
    }>({
        status: "all",
        clientId: "all",
        barberId: "all",
        serviceId: "all",
        date: null,
    });

    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    const form = useForm<z.infer<typeof appointmentFormSchema>>({
        resolver: zodResolver(appointmentFormSchema),
    });

    // --- Pobieranie danych dla filtrów ---
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };

                const [clientsRes, barbersRes, servicesRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?role=user`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/admin/barbers-for-select`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/admin/services`, { headers }),
                ]);

                if (!clientsRes.ok || !barbersRes.ok || !servicesRes.ok) {
                    throw new Error("Failed to fetch filter data");
                }

                setClients(await clientsRes.json());
                setBarbers(await barbersRes.json());
                setServices(await servicesRes.json());
            } catch (error) {
                toast.error("Could not load filter options.");
                console.error("Error fetching filter data:", error);
            }
        };
        fetchFilterData();
    }, []);

    // --- Pobieranie wizyt na podstawie filtrów ---
    const fetchAppointments = useCallback(async () => {
        setIsFetching(true);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== "all") {
                    if (key === "date" && value instanceof Date && !isNaN(value.getTime())) {
                        // BEZ toISOString() -> brak przesunięcia strefy
                        const dateStr = formatDateLocalYMD(value);
                        params.append("date", dateStr);
                    } else if (key !== "date") {
                        params.append(key, String(value));
                    }
                }
            });

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/admin/appointments?${params.toString()}`,
                { headers }
            );
            if (!response.ok) throw new Error("Failed to fetch appointments");

            setAppointments(await response.json());
        } catch (error) {
            toast.error("Could not fetch appointments.");
            console.error("Error fetching appointments:", error);
        } finally {
            setIsFetching(false);
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleFilterChange = (
        filterName: keyof typeof filters,
        value: string | Date | null
    ) => {
        setFilters((prev) => ({
            ...prev,
            [filterName]: value,
        }));
    };

    const handleDateFilterChange = (value: any) => {
        if (value === null) {
            setFilters((prev) => ({ ...prev, date: null }));
        } else if (value instanceof Date) {
            setFilters((prev) => ({ ...prev, date: value }));
        } else {
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime())) {
                setFilters((prev) => ({ ...prev, date: parsed }));
            }
        }
    };

    const clearFilters = () => {
        setFilters({
            status: "all",
            clientId: "all",
            barberId: "all",
            serviceId: "all",
            date: null,
        });
    };

    // --- Logika edycji i usuwania ---
    const handleEditClick = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        const appointmentDate = parseISO(appointment.appointment_time);
        form.reset({
            client_id: appointment.client_id.toString(),
            barber_id: appointment.barber_id.toString(),
            service_id: appointment.service_id.toString(),
            appointment_date: appointmentDate,
            appointment_time: format(appointmentDate, "HH:mm"),
            status: appointment.status as
                | "pending"
                | "confirmed"
                | "completed"
                | "canceled"
                | "no-show",
        });
    };

    const onSubmit = async (data: z.infer<typeof appointmentFormSchema>) => {
        if (!editingAppointment) return;
        try {
            const dateTime = new Date(data.appointment_date);
            const [hours, minutes] = data.appointment_time.split(":").map(Number);
            dateTime.setHours(hours, minutes, 0, 0);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/admin/appointments/${editingAppointment.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        ...data,
                        appointment_time: dateTime.toISOString(),
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update appointment");
            }
            toast.success(t('adminPanel.appointments.updated'));
            setEditingAppointment(null);
            fetchAppointments();
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const handleDeleteClick = (appointment: Appointment) => {
        setAppointmentToDelete(appointment);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!appointmentToDelete) return;
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/admin/appointments/${appointmentToDelete.id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            );
            if (!response.ok) throw new Error("Failed to delete appointment");
            toast.success(t('adminPanel.appointments.deleted'));
            setIsDeleteModalOpen(false);
            setAppointmentToDelete(null);
            fetchAppointments();
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <CardTitle>{t('adminPanel.appointments.title')}</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        {t('adminPanel.appointments.clearFilters')}
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4 p-4 border rounded-lg bg-muted/50">
                    <Select
                        value={filters.status}
                        onValueChange={(value) => handleFilterChange("status", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t('adminPanel.appointments.filterByStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('adminPanel.appointments.allStatuses')}</SelectItem>
                            <SelectItem value="pending">{t('adminPanel.appointments.pending')}</SelectItem>
                            <SelectItem value="confirmed">{t('adminPanel.appointments.confirmed')}</SelectItem>
                            <SelectItem value="completed">{t('adminPanel.appointments.completed')}</SelectItem>
                            <SelectItem value="canceled">{t('adminPanel.appointments.cancelled')}</SelectItem>
                            <SelectItem value="no-show">{t('adminPanel.appointments.noShow')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.clientId}
                        onValueChange={(value) => handleFilterChange("clientId", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t('adminPanel.appointments.filterByClient')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('adminPanel.appointments.allClients')}</SelectItem>
                            {clients.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.first_name} {c.last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.barberId}
                        onValueChange={(value) => handleFilterChange("barberId", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t('adminPanel.appointments.filterByBarber')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('adminPanel.appointments.allBarbers')}</SelectItem>
                            {barbers.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                    {b.first_name} {b.last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.serviceId}
                        onValueChange={(value) => handleFilterChange("serviceId", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t('adminPanel.appointments.filterByService')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('adminPanel.appointments.allServices')}</SelectItem>
                            {services.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal relative"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.date
                                    ? format(filters.date, "PPP", { locale: dateLocale })
                                    : <span>{t('adminPanel.appointments.filterByDate')}</span>}
                                {filters.date && (
                                    <X
                                        className="h-4 w-4 absolute right-2 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFilterChange("date", null);
                                        }}
                                    />
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <MuiCalendar
                                value={filters.date}
                                onChange={handleDateFilterChange}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>

            <CardContent>
                {isFetching ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
                    </div>
                ) : (
                    <>
                        {/* WIDOK NA KOMPUTERY */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('adminPanel.appointments.colDateTime')}</TableHead>
                                        <TableHead>{t('adminPanel.appointments.colClient')}</TableHead>
                                        <TableHead>{t('adminPanel.appointments.colBarber')}</TableHead>
                                        <TableHead>{t('adminPanel.appointments.colService')}</TableHead>
                                        <TableHead className="text-right">{t('adminPanel.appointments.colPrice')}</TableHead>
                                        <TableHead>{t('adminPanel.appointments.colStatus')}</TableHead>
                                        <TableHead className="text-right">{t('adminPanel.appointments.colActions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointments.length > 0 ? (
                                        appointments.map((appointment) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell>
                                                    {format(
                                                        parseISO(appointment.appointment_time),
                                                        "d MMM yyyy HH:mm",
                                                        { locale: dateLocale }
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {appointment.client_first_name}{" "}
                                                    {appointment.client_last_name}
                                                </TableCell>
                                                <TableCell>
                                                    {appointment.barber_first_name}{" "}
                                                    {appointment.barber_last_name}
                                                </TableCell>
                                                <TableCell>{appointment.service_name}</TableCell>
                                                <TableCell className="text-right">
                                                    {appointment.service_price.toFixed(2)} zł
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={appointment.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditClick(appointment)}
                                                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5 mr-1" />
                                                            {t('adminPanel.appointments.edit')}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDeleteClick(appointment)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                            {t('adminPanel.appointments.delete')}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24">
                                                {t('adminPanel.appointments.notFound')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* WIDOK NA URZĄDZENIA MOBILNE */}
                        <div className="md:hidden space-y-4">
                            {appointments.length > 0 ? (
                                appointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="border rounded-lg p-4 space-y-3 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start font-medium">
                                            <span className="text-foreground">
                                                {appointment.client_first_name}{" "}
                                                {appointment.client_last_name}
                                            </span>
                                            <StatusBadge status={appointment.status} />
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-2">
                                            <p>
                                                <strong className="font-medium text-foreground">
                                                    {t('adminPanel.appointments.datePrefix')}
                                                </strong>{" "}
                                                {format(
                                                    parseISO(appointment.appointment_time),
                                                    "d MMM yyyy HH:mm",
                                                    { locale: dateLocale }
                                                )}
                                            </p>
                                            <p>
                                                <strong className="font-medium text-foreground">
                                                    {t('adminPanel.appointments.barberPrefix')}
                                                </strong>{" "}
                                                {appointment.barber_first_name}{" "}
                                                {appointment.barber_last_name}
                                            </p>
                                            <p>
                                                <strong className="font-medium text-foreground">
                                                    {t('adminPanel.appointments.servicePrefix')}
                                                </strong>{" "}
                                                {appointment.service_name} (
                                                {appointment.service_price.toFixed(2)} zł)
                                            </p>
                                        </div>
                                        <div className="flex justify-end space-x-2 pt-3 border-t mt-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditClick(appointment)}
                                            >
                                                <Pencil className="h-4 w-4 mr-1.5" /> {t('adminPanel.appointments.edit')}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteClick(appointment)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" /> {t('adminPanel.appointments.delete')}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>{t('adminPanel.appointments.notFound')}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>

            {/* Edit Dialog */}
            <Dialog
                open={!!editingAppointment}
                onOpenChange={(open) => !open && setEditingAppointment(null)}
            >
                <DialogContent className="flex flex-col max-h-[90dvh] w-[calc(100vw-2rem)] sm:w-auto sm:max-w-lg p-0 gap-0">
                    {/* Sticky header */}
                    <DialogHeader className="px-5 pt-5 pb-4 border-b shrink-0">
                        <DialogTitle className="text-base sm:text-lg">
                            {t('adminPanel.appointments.editAppointment')}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto flex-1 px-5 py-4">
                        <Form {...form}>
                            <form
                                id="edit-appointment-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-3"
                            >
                                {/* Client + Barber – 2 cols on sm+ */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="client_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs sm:text-sm">
                                                    {t('adminPanel.appointments.colClient')}
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder={t('adminPanel.appointments.selectClient')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {clients.map((c) => (
                                                            <SelectItem key={c.id} value={String(c.id)}>
                                                                {c.first_name} {c.last_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="barber_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs sm:text-sm">
                                                    {t('adminPanel.appointments.colBarber')}
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder={t('adminPanel.appointments.selectBarber')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {barbers.map((b) => (
                                                            <SelectItem key={b.id} value={String(b.id)}>
                                                                {b.first_name} {b.last_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Service */}
                                <FormField
                                    control={form.control}
                                    name="service_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs sm:text-sm">
                                                {t('adminPanel.appointments.colService')}
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 text-sm">
                                                        <SelectValue placeholder={t('adminPanel.appointments.selectService')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {services.map((s) => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            {s.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Calendar */}
                                <FormField
                                    control={form.control}
                                    name="appointment_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs sm:text-sm">
                                                {t('adminPanel.appointments.dateLabel')}
                                            </FormLabel>
                                            <MuiCalendar value={field.value} onChange={field.onChange} />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Time + Status – 2 cols */}
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="appointment_time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs sm:text-sm">
                                                    {t('adminPanel.appointments.timeLabel')}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="time" className="h-9 text-sm" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs sm:text-sm">
                                                    {t('adminPanel.appointments.statusLabel')}
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder={t('adminPanel.appointments.selectStatus')} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="pending">{t('adminPanel.appointments.pending')}</SelectItem>
                                                        <SelectItem value="confirmed">{t('adminPanel.appointments.confirmed')}</SelectItem>
                                                        <SelectItem value="completed">{t('adminPanel.appointments.completed')}</SelectItem>
                                                        <SelectItem value="canceled">{t('adminPanel.appointments.cancelled')}</SelectItem>
                                                        <SelectItem value="no-show">{t('adminPanel.appointments.noShow')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    </div>

                    {/* Sticky footer */}
                    <DialogFooter className="px-5 py-4 border-t shrink-0 flex-row justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAppointment(null)}
                        >
                            {t('adminPanel.appointments.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            form="edit-appointment-form"
                            size="sm"
                        >
                            {t('adminPanel.appointments.saveChanges')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('adminPanel.appointments.deleteAppointment')}</DialogTitle>
                        <DialogDescription>
                            {t('adminPanel.appointments.deleteConfirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            {t('adminPanel.appointments.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            {t('adminPanel.appointments.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AdminAppointments;
