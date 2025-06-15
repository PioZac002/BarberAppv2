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
import { Pencil, Trash2, Filter, X, Calendar as CalendarIcon } from "lucide-react";
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
    client_id: z.string().min(1, "Client is required"),
    barber_id: z.string().min(1, "Barber is required"),
    service_id: z.string().min(1, "Service is required"),
    appointment_date: z.date({ required_error: "Date is required." }),
    appointment_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
    status: z.enum(["pending", "confirmed", "completed", "canceled", "no-show"]),
});

// --- Komponent główny ---
const AdminAppointments = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<SelectOption[]>([]);
    const [barbers, setBarbers] = useState<SelectOption[]>([]);
    const [services, setServices] = useState<ServiceOption[]>([]);

    const [filters, setFilters] = useState({
        status: 'all',
        clientId: 'all',
        barberId: 'all',
        serviceId: 'all',
        date: null as Date | null,
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
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [clientsRes, barbersRes, servicesRes] = await Promise.all([
                    fetch('http://localhost:3000/api/admin/users?role=user', { headers }),
                    fetch('http://localhost:3000/api/admin/barbers-for-select', { headers }),
                    fetch('http://localhost:3000/api/admin/services', { headers }),
                ]);

                if (!clientsRes.ok || !barbersRes.ok || !servicesRes.ok) throw new Error('Failed to fetch filter data');

                setClients(await clientsRes.json());
                setBarbers(await barbersRes.json());
                setServices(await servicesRes.json());
            } catch (error) {
                toast.error("Could not load filter options.");
                console.error('Error fetching filter data:', error);
            }
        };
        fetchFilterData();
    }, []);

    // --- Pobieranie wizyt na podstawie filtrów ---
    const fetchAppointments = useCallback(async () => {
        setIsFetching(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    if (key === 'date' && value instanceof Date) {
                        params.append(key, value.toISOString().split('T')[0]);
                    } else if (key !== 'date') {
                        params.append(key, String(value));
                    }
                }
            });

            const response = await fetch(`http://localhost:3000/api/admin/appointments?${params.toString()}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch appointments');

            setAppointments(await response.json());

        } catch (error) {
            toast.error("Could not fetch appointments.");
            console.error('Error fetching appointments:', error);
        } finally {
            setIsFetching(false);
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleFilterChange = (filterName: keyof typeof filters, value: string | Date | null) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
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
            status: appointment.status as "pending" | "confirmed" | "completed" | "canceled" | "no-show",
        });
    };

    const onSubmit = async (data: z.infer<typeof appointmentFormSchema>) => {
        if (!editingAppointment) return;
        try {
            const dateTime = new Date(data.appointment_date);
            const [hours, minutes] = data.appointment_time.split(':').map(Number);
            dateTime.setHours(hours, minutes, 0, 0);

            const response = await fetch(`http://localhost:3000/api/admin/appointments/${editingAppointment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ ...data, appointment_time: dateTime.toISOString() }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update appointment');
            }
            toast.success('Appointment updated successfully');
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
            const response = await fetch(`http://localhost:3000/api/admin/appointments/${appointmentToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!response.ok) throw new Error('Failed to delete appointment');
            toast.success('Appointment deleted successfully');
            setIsDeleteModalOpen(false);
            setAppointmentToDelete(null);
            fetchAppointments();
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appointments Management</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4 p-4 border rounded-lg bg-gray-50/50">
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                            <SelectItem value="no-show">No-Show</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.clientId} onValueChange={(value) => handleFilterChange('clientId', value)}>
                        <SelectTrigger><SelectValue placeholder="Filter by client" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Clients</SelectItem>
                            {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.first_name} {c.last_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.barberId} onValueChange={(value) => handleFilterChange('barberId', value)}>
                        <SelectTrigger><SelectValue placeholder="Filter by barber" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Barbers</SelectItem>
                            {barbers.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.first_name} {b.last_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.serviceId} onValueChange={(value) => handleFilterChange('serviceId', value)}>
                        <SelectTrigger><SelectValue placeholder="Filter by service" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Services</SelectItem>
                            {services.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal relative">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.date ? format(filters.date, "PPP") : <span>Filter by date</span>}
                                {filters.date && <X className="h-4 w-4 absolute right-2 text-gray-500 hover:text-gray-800" onClick={(e) => { e.stopPropagation(); handleFilterChange('date', null); }} />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <MuiCalendar
                                value={filters.date}
                                onChange={(date) => handleFilterChange('date', date)}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                {isFetching ? (
                    <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div></div>
                ) : (
                    <>
                        {/* WIDOK NA KOMPUTERY */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Barber</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointments.length > 0 ? appointments.map((appointment) => (
                                        <TableRow key={appointment.id}>
                                            <TableCell>{format(parseISO(appointment.appointment_time), 'MMM dd, yyyy HH:mm')}</TableCell>
                                            <TableCell>{appointment.client_first_name} {appointment.client_last_name}</TableCell>
                                            <TableCell>{appointment.barber_first_name} {appointment.barber_last_name}</TableCell>
                                            <TableCell>{appointment.service_name}</TableCell>
                                            <TableCell className="text-right">${appointment.service_price.toFixed(2)}</TableCell>
                                            <TableCell><Badge variant={appointment.status === 'completed' ? 'default' : appointment.status === 'canceled' ? 'destructive' : 'secondary'}>{appointment.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(appointment)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteClick(appointment)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={7} className="text-center h-24">No appointments found for the selected filters.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* WIDOK NA URZĄDZENIA MOBILNE */}
                        <div className="md:hidden space-y-4">
                            {appointments.length > 0 ? appointments.map((appointment) => (
                                <div key={appointment.id} className="border rounded-lg p-4 space-y-3 shadow-sm">
                                    <div className="flex justify-between items-start font-medium">
                                        <span className="text-gray-800">{appointment.client_first_name} {appointment.client_last_name}</span>
                                        <Badge variant={appointment.status === 'completed' ? 'default' : appointment.status === 'canceled' ? 'destructive' : 'secondary'}>{appointment.status}</Badge>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-2">
                                        <p><strong className="font-medium text-gray-700">Date:</strong> {format(parseISO(appointment.appointment_time), 'MMM dd, yyyy HH:mm')}</p>
                                        <p><strong className="font-medium text-gray-700">Barber:</strong> {appointment.barber_first_name} {appointment.barber_last_name}</p>
                                        <p><strong className="font-medium text-gray-700">Service:</strong> {appointment.service_name} (${appointment.service_price.toFixed(2)})</p>
                                    </div>
                                    <div className="flex justify-end space-x-2 pt-3 border-t mt-3">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(appointment)}>
                                            <Pencil className="h-4 w-4 mr-1.5" /> Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(appointment)}>
                                            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-gray-500">
                                    <p>No appointments found for the selected filters.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Appointment</DialogTitle></DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="client_id" render={({ field }) => ( <FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl><SelectContent>{clients.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.first_name} {c.last_name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="barber_id" render={({ field }) => ( <FormItem><FormLabel>Barber</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select barber" /></SelectTrigger></FormControl><SelectContent>{barbers.map((b) => (<SelectItem key={b.id} value={String(b.id)}>{b.first_name} {b.last_name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="service_id" render={({ field }) => ( <FormItem><FormLabel>Service</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger></FormControl><SelectContent>{services.map((s) => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />

                            <FormField control={form.control} name="appointment_date" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date</FormLabel>
                                    <MuiCalendar
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="appointment_time" render={({ field }) => ( <FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="canceled">Canceled</SelectItem><SelectItem value="no-show">No-show</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingAppointment(null)}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Appointment</DialogTitle><DialogDescription>Are you sure? This action cannot be undone.</DialogDescription></DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AdminAppointments;
