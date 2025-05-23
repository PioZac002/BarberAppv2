import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Filter, SortAsc, SortDesc, Calendar as CalendarIcon } from "lucide-react";
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
import { format } from "date-fns";
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
import Calendar from "@/components/ui/calendar";

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
    client_id: number; // Zaktualizowane na wymagane pole
    barber_id: number; // Zaktualizowane na wymagane pole
    service_id: number; // Zaktualizowane na wymagane pole
}

const appointmentFormSchema = z.object({
    client_id: z.string().min(1, "Client is required"),
    barber_id: z.string().min(1, "Barber is required"),
    service_id: z.string().min(1, "Service is required"),
    appointment_date: z.date(),
    appointment_time: z.string().min(1, "Appointment time is required"),
    status: z.enum(["pending", "confirmed", "completed", "canceled"]),
});

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [barbers, setBarbers] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortField, setSortField] = useState<string>("appointment_time");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);

    const form = useForm<z.infer<typeof appointmentFormSchema>>({
        resolver: zodResolver(appointmentFormSchema),
        defaultValues: {
            client_id: "",
            barber_id: "",
            service_id: "",
            appointment_date: new Date(),
            appointment_time: "",
            status: "pending",
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appointmentsRes, clientsRes, barbersRes, servicesRes] = await Promise.all([
                    fetch('http://localhost:3000/api/admin/appointments', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                    fetch('http://localhost:3000/api/admin/users?role=client', { // Zakładam endpoint z filtrem roli
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                    fetch('http://localhost:3000/api/admin/users?role=barber', { // Zakładam endpoint z filtrem roli
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                    fetch('http://localhost:3000/api/admin/services', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }),
                ]);

                if (!appointmentsRes.ok || !clientsRes.ok || !barbersRes.ok || !servicesRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const appointmentsData = await appointmentsRes.json();
                const clientsData = await clientsRes.json();
                const barbersData = await barbersRes.json();
                const servicesData = await servicesRes.json();

                setAppointments(appointmentsData);
                setClients(clientsData);
                setBarbers(barbersData);
                setServices(servicesData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSortChange = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const filteredAndSortedAppointments = [...appointments]
        .filter(appointment => statusFilter === "all" || appointment.status === statusFilter)
        .sort((a, b) => {
            const valueA = a[sortField as keyof Appointment];
            const valueB = b[sortField as keyof Appointment];
            if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
            if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

    const handleEditClick = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        const appointmentDate = new Date(appointment.appointment_time);
        const hours = appointmentDate.getHours().toString().padStart(2, '0');
        const minutes = appointmentDate.getMinutes().toString().padStart(2, '0');
        form.reset({
            client_id: appointment.client_id.toString(),
            barber_id: appointment.barber_id.toString(),
            service_id: appointment.service_id.toString(),
            appointment_date: appointmentDate,
            appointment_time: `${hours}:${minutes}`,
            status: appointment.status as "pending" | "confirmed" | "completed" | "canceled",
        });
    };

    const handleDeleteClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsDeleteModalOpen(true);
    };

    const onSubmit = async (data: z.infer<typeof appointmentFormSchema>) => {
        if (!editingAppointment) return;
        try {
            const dateTime = new Date(data.appointment_date);
            const [hours, minutes] = data.appointment_time.split(':').map(Number);
            dateTime.setHours(hours, minutes, 0, 0);
            const appointmentData = {
                client_id: parseInt(data.client_id),
                barber_id: parseInt(data.barber_id),
                service_id: parseInt(data.service_id),
                appointment_time: dateTime.toISOString(),
                status: data.status,
            };
            const response = await fetch(`http://localhost:3000/api/admin/appointments/${editingAppointment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(appointmentData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update appointment');
            }

            toast.success('Appointment updated successfully');
            setEditingAppointment(null);
            const updatedAppointments = await fetch('http://localhost:3000/api/admin/appointments', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            }).then(res => res.json());
            setAppointments(updatedAppointments);
        } catch (error: any) {
            console.error('Error updating appointment:', error.message);
            toast.error(`Error: ${error.message}`);
        }
    };

    const handleDelete = async () => {
        if (!selectedAppointment) return;
        try {
            const response = await fetch(`http://localhost:3000/api/admin/appointments/${selectedAppointment.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete appointment');
            }

            setAppointments(appointments.filter(appointment => appointment.id !== selectedAppointment.id));
            setIsDeleteModalOpen(false);
            setSelectedAppointment(null);
            toast.success('Appointment deleted successfully');
        } catch (error: any) {
            console.error('Error deleting appointment:', error.message);
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
                <CardTitle>Appointments Management</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <div className="flex items-center">
                        <Filter className="w-4 h-4 mr-2 text-gray-500" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="canceled">Canceled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer" onClick={() => handleSortChange("appointment_time")}>
                                    Date & Time
                                    {sortField === "appointment_time" && (sortDirection === "asc" ? <SortAsc className="h-4 w-4 inline ml-1" /> : <SortDesc className="h-4 w-4 inline ml-1" />)}
                                </TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Barber</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSortChange("status")}>
                                    Status
                                    {sortField === "status" && (sortDirection === "asc" ? <SortAsc className="h-4 w-4 inline ml-1" /> : <SortDesc className="h-4 w-4 inline ml-1" />)}
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSortChange("created_at")}>
                                    Created At
                                    {sortField === "created_at" && (sortDirection === "asc" ? <SortAsc className="h-4 w-4 inline ml-1" /> : <SortDesc className="h-4 w-4 inline ml-1" />)}
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedAppointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                    <TableCell>{format(new Date(appointment.appointment_time), 'MMM dd, yyyy HH:mm')}</TableCell>
                                    <TableCell>{appointment.client_first_name} {appointment.client_last_name}</TableCell>
                                    <TableCell>{appointment.barber_first_name} {appointment.barber_last_name}</TableCell>
                                    <TableCell>{appointment.service_name}</TableCell>
                                    <TableCell className="text-right">${appointment.service_price}</TableCell>
                                    <TableCell>{appointment.status}</TableCell>
                                    <TableCell>{format(new Date(appointment.created_at), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(appointment)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteClick(appointment)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="md:hidden space-y-4">
                    {filteredAndSortedAppointments.map((appointment) => (
                        <div key={appointment.id} className="border rounded-md p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium">{format(new Date(appointment.appointment_time), 'MMM dd, yyyy HH:mm')}</h3>
                                    <p className="text-sm text-gray-500">{appointment.service_name}</p>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs font-medium">{appointment.status}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-500">Client:</p>
                                    <p>{appointment.client_first_name} {appointment.client_last_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Barber:</p>
                                    <p>{appointment.barber_first_name} {appointment.barber_last_name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Price:</p>
                                    <p>${appointment.service_price}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Created:</p>
                                    <p>{format(new Date(appointment.created_at), 'MMM dd, yyyy')}</p>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2 border-t">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(appointment)}>
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDeleteClick(appointment)}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            {/* Edit Appointment Dialog */}
            <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Appointment</DialogTitle>
                        <DialogDescription>Update appointment details.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="client_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select client" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {clients.map((client) => (
                                                    <SelectItem key={client.id} value={client.id.toString()}>
                                                        {client.first_name} {client.last_name}
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
                                                    <SelectValue placeholder="Select barber" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {barbers.map((barber) => (
                                                    <SelectItem key={barber.id} value={barber.id.toString()}>
                                                        {barber.first_name} {barber.last_name}
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
                                        <FormLabel>Service</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select service" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {services.map((service) => (
                                                    <SelectItem key={service.id} value={service.id.toString()}>
                                                        {service.name}
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
                                        <FormLabel>Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="appointment_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time</FormLabel>
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
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="canceled">Canceled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingAppointment(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Appointment</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this appointment? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div>
                            <p><strong>Client:</strong> {selectedAppointment.client_first_name} {selectedAppointment.client_last_name}</p>
                            <p><strong>Barber:</strong> {selectedAppointment.barber_first_name} {selectedAppointment.barber_last_name}</p>
                            <p><strong>Service:</strong> {selectedAppointment.service_name}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AdminAppointments;