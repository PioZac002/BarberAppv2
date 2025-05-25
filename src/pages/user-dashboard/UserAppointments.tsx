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
    Star, // Upewniono się, że Star jest zaimportowane
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { isValid, format } from "date-fns";

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

const UserAppointments = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    useRequireAuth({ allowedRoles: ["client"] }); // Ochrona trasy

    const [appointmentList, setAppointmentList] = useState<Appointment[]>([]);
    const [filter, setFilter] = useState("all");
    const [isDataLoading, setIsDataLoading] = useState(true); // Lokalne ładowanie danych

    useEffect(() => {
        if (authContextLoading) {
            setIsDataLoading(true);
            return;
        }

        if (!token || !authUser) {
            setIsDataLoading(false);
            setAppointmentList([]);
            // toast.error("Authentication required to view appointments."); // Można odkomentować w razie potrzeby
            return;
        }

        const fetchAppointments = async () => {
            setIsDataLoading(true);
            let url = "http://localhost:3000/api/user/appointments";
            if (filter !== "all") {
                url += `?status=${filter}`;
            }

            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    let errorMsg = "Failed to fetch appointments";
                    try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /* ignore */ }
                    throw new Error(errorMsg);
                }
                const data: Appointment[] = await response.json();
                // Sortowanie po dacie wizyty, od najnowszej (lub najbliższej, zależy od preferencji)
                data.sort((a, b) => new Date(b.appointment_timestamp).getTime() - new Date(a.appointment_timestamp).getTime());
                setAppointmentList(data);
            } catch (error: any) {
                toast.error(error.message || "Failed to load appointments.");
                setAppointmentList([]); // Wyczyść w razie błędu
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchAppointments();
    }, [authUser, token, filter, authContextLoading]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "confirmed": return "bg-green-100 text-green-800";
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "completed": return "bg-blue-100 text-blue-800";
            case "canceled": case "cancelled": return "bg-red-100 text-red-800";
            case "no-show": return "bg-orange-100 text-orange-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const handleCancelAppointment = async (id: number) => {
        if (!token) {
            toast.error("Authentication error. Cannot cancel appointment.");
            return;
        }
        if (!window.confirm("Are you sure you want to cancel this appointment?")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/api/user/appointments/${id}/cancel`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to cancel appointment");
            }
            setAppointmentList(prev =>
                prev.map(appointment =>
                    appointment.id === id ? { ...appointment, status: "canceled" } : appointment
                ).sort((a, b) => new Date(b.appointment_timestamp).getTime() - new Date(a.appointment_timestamp).getTime())
            );
            toast.success("Appointment cancelled successfully");
        } catch (error: any) {
            toast.error(error.message || "Could not cancel appointment.");
        }
    };

    if (authContextLoading || isDataLoading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    // Ten warunek powinien być obsłużony przez useRequireAuth (przekierowanie)
    // ale zostawiamy jako dodatkowe zabezpieczenie przed renderowaniem pustej strony
    if (!authContextLoading && !authUser) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">Could not authenticate user to view appointments.</p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted"><Link to="/login">Go to Login</Link></Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
                    <p className="text-sm text-gray-600">Manage your upcoming and past appointments.</p>
                </div>
                <Button asChild className="bg-barber hover:bg-barber-muted w-full sm:w-auto">
                    <Link to="/booking">
                        <Plus className="h-4 w-4 mr-2" />
                        Book New Appointment
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
                <Label htmlFor="status-filter" className="text-sm font-medium flex items-center whitespace-nowrap">
                    <ListFilter className="h-4 w-4 mr-1.5 text-gray-500"/> Filter by status:
                </Label>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" id="status-filter">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {["all", "confirmed", "pending", "completed", "canceled", "no-show"].map((status) => (
                            <SelectItem key={status} value={status}>
                                {status === "all" ? "All Appointments" : status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {appointmentList.length > 0 ? (
                    appointmentList.map((appointment) => (
                        <Card key={appointment.id} className="hover:shadow-lg transition-shadow duration-200">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-1">
                                            <h3 className="font-semibold text-md sm:text-lg text-gray-800">{appointment.service}</h3>
                                            <Badge className={`${getStatusColor(appointment.status)} text-xs sm:text-sm`}>
                                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600 pt-1">
                                            <div className="flex items-center">
                                                <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                <span>Barber: {appointment.barber}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                {/* Poprawione formatowanie daty */}
                                                <span>{isValid(new Date(appointment.date)) ? format(new Date(appointment.date), "MMM d, yyyy") : "Invalid date"}</span>
                                            </div>
                                            <div className="flex items-center sm:col-span-2">
                                                <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                <span>{appointment.time} (Duration: {appointment.duration})</span>
                                            </div>
                                        </div>

                                        <div className="text-md sm:text-lg font-semibold text-barber pt-1">
                                            Price: {appointment.price}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 mt-2 lg:mt-0 lg:ml-4 shrink-0 w-full sm:w-auto lg:w-[150px]">
                                        {(appointment.status.toLowerCase() === "confirmed" || appointment.status.toLowerCase() === "pending") && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCancelAppointment(appointment.id)}
                                                className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" />
                                                Cancel
                                            </Button>
                                        )}
                                        {appointment.status.toLowerCase() === "confirmed" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="w-full border-barber text-barber hover:bg-barber/10"
                                                title="Reschedule (coming soon)"
                                            >
                                                <Edit className="h-4 w-4 mr-1.5" />
                                                Reschedule
                                            </Button>
                                        )}
                                        {appointment.status.toLowerCase() === "completed" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="w-full border-barber text-barber hover:bg-barber/10"
                                                title="Leave Review (coming soon)"
                                            >
                                                <Star className="h-4 w-4 mr-1.5" />
                                                Leave Review
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
                            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                No appointments found
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {filter === "all"
                                    ? "You haven't booked any appointments yet."
                                    : `You have no ${filter} appointments.`
                                }
                            </p>
                            <Button asChild className="bg-barber hover:bg-barber-muted">
                                <Link to="/booking">Book Your First Appointment</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default UserAppointments;