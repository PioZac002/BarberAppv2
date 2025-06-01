// src/pages/barber-dashboard/BarberAppointments.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; // Zmieniono z useRequireAuth
// import DashboardLayout from "@/components/dashboard/DashboardLayout"; // <-- USUNIĘTY IMPORT
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription // Dodano CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays as CalendarIcon, Filter, Check, X, User as UserIconLucide } from "lucide-react"; // Zmieniono alias dla User
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCard } from "@/components/ui/table";
import { Link } from "react-router-dom"; // Dodano, jeśli useRequireAuth przekierowuje
import { isValid, format } from 'date-fns'; // Dodano isValid i format

interface Appointment {
    id: number;
    client_name: string;
    client_phone: string;
    service_name: string;
    price: number | string;
    appointment_time: string;
    status: string;
}

const BarberAppointmentsPage = () => { // Zmieniono nazwę komponentu
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    // useRequireAuth jest już w BarberDashboard.tsx

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all"); // upcoming, past, all
    const [isLoadingData, setIsLoadingData] = useState(true); // Lokalne ładowanie

    useEffect(() => {
        if (authContextLoading) {
            setIsLoadingData(true);
            return;
        }
        if (!authUser || !token) {
            setIsLoadingData(false);
            setAppointments([]);
            return;
        }

        const fetchAppointments = async () => {
            if (!token) return;
            setIsLoadingData(true);
            let url = "http://localhost:3000/api/barber/appointments";
            const params = new URLSearchParams();
            if (timeFilter !== "all") {
                params.append("upcoming", timeFilter === "upcoming" ? "true" : "false");
            }
            // Backend już filtruje po statusie jeśli jest wysłany,
            // ale frontend też filtruje, co jest OK.
            // Można by wysyłać statusFilter do backendu, jeśli API to obsługuje.

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(()=>({error: "Failed to fetch appointments"}));
                    throw new Error(errorData.error || "Failed to fetch appointments");
                }
                const data = await response.json();
                // Sortowanie po dacie wizyty, od najnowszej
                data.sort((a: Appointment, b: Appointment) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
                setAppointments(data);
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "Failed to load appointments");
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchAppointments();
    }, [authUser, token, timeFilter, authContextLoading]); // usunięto loading z useRequireAuth

    const getStatusBadgeVariant = (status: string) => { /* ... bez zmian ... */ };
    const filteredAppointments = appointments.filter((appointment) =>
        statusFilter === "all" || appointment.status.toLowerCase() === statusFilter.toLowerCase()
    );
    const handleStatusChange = async (appointmentId: number, newStatus: string) => { /* ... użyj token z useAuth ... */ };

    const handleStatusChangeUpdated = async (appointmentId: number, newStatus: string) => {
        if(!token) { toast.error("Authentication error."); return; }
        try {
            const response = await fetch(`http://localhost:3000/api/barber/appointments/${appointmentId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(()=>({error:"Failed to update status"}));
                throw new Error(errorData.error || "Failed to update appointment status");
            }
            setAppointments((prev) =>
                prev.map((apt) =>
                    apt.id === appointmentId ? { ...apt, status: newStatus } : apt
                ).sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime())
            );
            toast.success(`Appointment status updated to ${newStatus}`);
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error(error.message || "Failed to update appointment status");
        }
    };


    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const mobileRender = (appointment: Appointment) => { /* ... bez zmian, ale użyj handleStatusChangeUpdated ... */ };
    const mobileRenderUpdated = (appointment: Appointment) => (
        <TableCard key={appointment.id}>
            <div className="flex flex-col space-y-2 p-4">
                <div className="flex justify-between items-center">
                    <span className="font-medium">{appointment.client_name}</span>
                    <Badge className={getStatusBadgeVariant(appointment.status)}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                </div>
                <div className="text-sm text-gray-600">{appointment.service_name}</div>
                <div className="text-sm text-gray-500">
                    {isValid(new Date(appointment.appointment_time)) ? format(new Date(appointment.appointment_time), 'PPpp') : 'Invalid Date'}
                </div>
                <div className="text-xs text-gray-500">Tel: {appointment.client_phone || "N/A"}</div>
                <div className="text-sm text-gray-600">
                    Price: ${parseFloat(String(appointment.price)).toFixed(2)}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                    {appointment.status === "pending" && (
                        <>
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white w-full" onClick={() => handleStatusChangeUpdated(appointment.id, "confirmed")}><Check className="h-4 w-4 mr-1" />Confirm</Button>
                            <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 w-full" onClick={() => handleStatusChangeUpdated(appointment.id, "canceled")}><X className="h-4 w-4 mr-1" />Cancel</Button>
                        </>
                    )}
                    {appointment.status === "confirmed" && (
                        <>
                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white w-full" onClick={() => handleStatusChangeUpdated(appointment.id, "completed")}><Check className="h-4 w-4 mr-1" />Complete</Button>
                            <Button size="sm" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 w-full" onClick={() => handleStatusChangeUpdated(appointment.id, "no-show")}><UserIconLucide className="h-4 w-4 mr-1" />No Show</Button>
                        </>
                    )}
                </div>
            </div>
        </TableCard>
    );


    if (authContextLoading || isLoadingData) { // Sprawdzamy oba stany ładowania
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        // Komponent NIE renderuje DashboardLayout
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 border-b pb-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center text-xl sm:text-2xl">
                        <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-barber" />
                        Appointments Management
                    </CardTitle>
                    <CardDescription>Review and manage your client appointments.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-gray-500 hidden sm:block" />
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-full sm:w-36 h-9 text-xs sm:text-sm">
                            <SelectValue placeholder="Filter by time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Times</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="past">Past</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40 h-9 text-xs sm:text-sm">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                            <SelectItem value="no-show">No Show</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
                {isMobile ? (
                    <div className="space-y-4">
                        {filteredAppointments.length > 0 ?
                            filteredAppointments.map(mobileRenderUpdated) : // Użyj zaktualizowanej funkcji
                            (
                                <div className="text-center py-10 col-span-full">
                                    <Info className="h-12 w-12 text-gray-300 mx-auto mb-3"/>
                                    <p className="text-gray-500">No appointments match your current filters.</p>
                                </div>
                            )
                        }
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAppointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{appointment.client_name}</div>
                                            <div className="text-sm text-gray-500">{appointment.client_phone || "N/A"}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{appointment.service_name}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div>{isValid(new Date(appointment.appointment_time)) ? format(new Date(appointment.appointment_time), "PP") : 'Invalid Date'}</div>
                                            <div className="text-sm text-gray-500">{isValid(new Date(appointment.appointment_time)) ? format(new Date(appointment.appointment_time), "p") : ''}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>${parseFloat(String(appointment.price)).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusBadgeVariant(appointment.status)}>
                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex space-x-1 justify-end">
                                            {appointment.status === "pending" && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8" onClick={() => handleStatusChangeUpdated(appointment.id, "confirmed")} title="Confirm"><Check className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8" onClick={() => handleStatusChangeUpdated(appointment.id, "canceled")} title="Cancel"><X className="h-4 w-4" /></Button>
                                                </>
                                            )}
                                            {appointment.status === "confirmed" && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8" onClick={() => handleStatusChangeUpdated(appointment.id, "completed")} title="Mark as Completed"><Check className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 w-8" onClick={() => handleStatusChangeUpdated(appointment.id, "no-show")} title="Mark as No Show"><UserIconLucide className="h-4 w-4" /></Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {filteredAppointments.length === 0 && !isLoadingData && ( // Pokaż tylko jeśli nie ładuje i nie ma danych
                    <div className="text-center py-12">
                        <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
                        <p className="text-gray-500">
                            {statusFilter === "all" && timeFilter === "all"
                                ? "You currently have no appointments."
                                : `No appointments match the current filters.`}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default BarberAppointmentsPage; // Zmieniono nazwę eksportu