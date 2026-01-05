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
import { Pencil, Trash2, X, Calendar as CalendarIcon, RotateCcw } from "lucide-react";
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
import { pl } from "date-fns/locale";
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
import { Badge } from "@/components/ui/badge";

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

// --- Komponent główny ---
const AdminAppointments = () => {
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
            toast.success("Appointment updated successfully");
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
            toast.success("Appointment deleted successfully");
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
                    <CardTitle>Zarządzanie wizytami</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Wyczyść filtry
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4 p-4 border rounded-lg bg-gray-50/50">
                    <Select
                        value={filters.status}
                        onValueChange={(value) => handleFilterChange("status", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filtruj według statusu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszystkie statusy</SelectItem>
                            <SelectItem value="pending">Oczekujące</SelectItem>
                            <SelectItem value="confirmed">Potwierdzone</SelectItem>
                            <SelectItem value="completed">Zrealizowane</SelectItem>
                            <SelectItem value="canceled">Anulowane</SelectItem>
                            <SelectItem value="no-show">Nieobecność</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.clientId}
                        onValueChange={(value) => handleFilterChange("clientId", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filtruj według klienta" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszyscy klienci</SelectItem>
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
                            <SelectValue placeholder="Filtruj według barbera" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszyscy barberzy</SelectItem>
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
                            <SelectValue placeholder="Filtruj według usługi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszystkie usługi</SelectItem>
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
                                    ? format(filters.date, "PPP", { locale: pl })
                                    : <span>Filtruj według daty</span>}
                                {filters.date && (
                                    <X
                                        className="h-4 w-4 absolute right-2 text-gray-500 hover:text-gray-800"
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
                                        <TableHead>Data i godzina</TableHead>
                                        <TableHead>Klient</TableHead>
                                        <TableHead>Barber</TableHead>
                                        <TableHead>Usługa</TableHead>
                                        <TableHead className="text-right">Cena</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Akcje</TableHead>
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
                                                        { locale: pl }
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
                                                    <Badge
                                                        variant={
                                                            appointment.status === "completed"
                                                                ? "default"
                                                                : appointment.status === "canceled"
                                                                    ? "destructive"
                                                                    : "secondary"
                                                        }
                                                    >
                                                        {appointment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditClick(appointment)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500"
                                                        onClick={() => handleDeleteClick(appointment)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24">
                                                Nie znaleziono wizyt dla wybranych filtrów.
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
                                            <span className="text-gray-800">
                                                {appointment.client_first_name}{" "}
                                                {appointment.client_last_name}
                                            </span>
                                            <Badge
                                                variant={
                                                    appointment.status === "completed"
                                                        ? "default"
                                                        : appointment.status === "canceled"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                            >
                                                {appointment.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-2">
                                            <p>
                                                <strong className="font-medium text-gray-700">
                                                    Data:
                                                </strong>{" "}
                                                {format(
                                                    parseISO(appointment.appointment_time),
                                                    "d MMM yyyy HH:mm",
                                                    { locale: pl }
                                                )}
                                            </p>
                                            <p>
                                                <strong className="font-medium text-gray-700">
                                                    Barber:
                                                </strong>{" "}
                                                {appointment.barber_first_name}{" "}
                                                {appointment.barber_last_name}
                                            </p>
                                            <p>
                                                <strong className="font-medium text-gray-700">
                                                    Usługa:
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
                                                <Pencil className="h-4 w-4 mr-1.5" /> Edytuj
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteClick(appointment)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" /> Usuń
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <p>Nie znaleziono wizyt dla wybranych filtrów.</p>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edytuj wizytę</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="client_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Klient</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Wybierz klienta" />
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
                                        <FormLabel>Barber</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Wybierz barbera" />
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

                            <FormField
                                control={form.control}
                                name="service_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Usługa</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Wybierz usługę" />
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

                            <FormField
                                control={form.control}
                                name="appointment_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Data</FormLabel>
                                        <MuiCalendar value={field.value} onChange={field.onChange} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="appointment_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Godzina</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
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
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Wybierz status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">Oczekujące</SelectItem>
                                                <SelectItem value="confirmed">Potwierdzone</SelectItem>
                                                <SelectItem value="completed">Zrealizowane</SelectItem>
                                                <SelectItem value="canceled">Anulowane</SelectItem>
                                                <SelectItem value="no-show">Nieobecność</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingAppointment(null)}
                                >
                                    Anuluj
                                </Button>
                                <Button type="submit">Zapisz zmiany</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Usuń wizytę</DialogTitle>
                        <DialogDescription>
                            Czy na pewno chcesz usunąć tę wizytę? Tej akcji nie można cofnąć.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Anuluj
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            Usuń
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AdminAppointments;
