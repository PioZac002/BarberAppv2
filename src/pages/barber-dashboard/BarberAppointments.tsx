import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CalendarIcon,
    Filter,
    Check,
    X,
    User // Dodana ikona User dla No Show
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableCard,
} from "@/components/ui/table";

interface Appointment {
    id: number;
    client_name: string;
    client_phone: string;
    service_name: string;
    price: number | string; // Zmieniono na number | string, aby obsłużyć dane z API
    appointment_time: string;
    status: string;
}

const BarberAppointments = () => {
    const { user, loading } = useRequireAuth({ allowedRoles: ["barber", "admin"] });
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");


    useEffect(() => {
        if (!user || loading) return;

        const fetchAppointments = async () => {
            let url = "http://localhost:3000/api/barber/appointments";
            if (timeFilter === "upcoming") {
                url += "?upcoming=true";
            } else if (timeFilter === "past") {
                url += "?upcoming=false";
            }

            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (!response.ok) throw new Error("Failed to fetch appointments");
                const data = await response.json();
                setAppointments(data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load appointments");
            }
        };

        fetchAppointments();
    }, [user, loading, timeFilter]);

    if (loading) {
        return (
            <DashboardLayout title="My Appointments"> {/* Dodano Layout dla spójności */}
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
                </div>
            </DashboardLayout>
        );
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "confirmed": return "bg-green-100 text-green-800";
            case "completed": return "bg-blue-100 text-blue-800";
            case "canceled": return "bg-red-100 text-red-800";
            case "no-show": return "bg-orange-100 text-orange-800"; // Zmieniono na pomarańczowy
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const filteredAppointments = appointments.filter((appointment) =>
        statusFilter === "all" || appointment.status === statusFilter
    );

    const handleStatusChange = async (appointmentId: number, newStatus: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/barber/appointments/${appointmentId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update appointment status");
            }
            setAppointments((prev) =>
                prev.map((apt) =>
                    apt.id === appointmentId ? { ...apt, status: newStatus } : apt
                )
            );
            toast.success(`Appointment status updated to ${newStatus}`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to update appointment status");
        }
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const mobileRender = (appointment: Appointment) => (
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
                    {new Date(appointment.appointment_time).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Tel: {appointment.client_phone}</div>
                <div className="text-sm text-gray-600">
                    Price: ${parseFloat(String(appointment.price)).toFixed(2)} {/* POPRAWKA TUTAJ */}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                    {appointment.status === "pending" && (
                        <>
                            <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white w-full"
                                onClick={() => handleStatusChange(appointment.id, "confirmed")}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Confirm
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50 w-full"
                                onClick={() => handleStatusChange(appointment.id, "canceled")}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                            </Button>
                        </>
                    )}
                    {appointment.status === "confirmed" && (
                        <>
                            <Button
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600 text-white w-full"
                                onClick={() => handleStatusChange(appointment.id, "completed")}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-500 text-orange-500 hover:bg-orange-50 w-full"
                                onClick={() => handleStatusChange(appointment.id, "no-show")}
                            >
                                <User className="h-4 w-4 mr-1" /> No Show
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </TableCard>
    );

    return (
        <DashboardLayout title="My Appointments">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                    <CardTitle className="flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-barber" />
                        Appointments Management
                    </CardTitle>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                        <Filter className="h-4 w-4 text-gray-500 hidden sm:block" />
                        <Select value={timeFilter} onValueChange={setTimeFilter}>
                            <SelectTrigger className="w-full sm:w-36"> {/* Zwiększona szerokość */}
                                <SelectValue placeholder="Filter by time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Times</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="past">Past</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-40"> {/* Zwiększona szerokość */}
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
                <CardContent>
                    {isMobile ? (
                        <div className="space-y-4">
                            {filteredAppointments.length > 0 ?
                                filteredAppointments.map(mobileRender) : null}
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
                                                <div className="text-sm text-gray-500">{appointment.client_phone}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{appointment.service_name}</TableCell>
                                        <TableCell>
                                            <div>
                                                <div>{new Date(appointment.appointment_time).toLocaleDateString()}</div>
                                                <div className="text-sm text-gray-500">{new Date(appointment.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>${parseFloat(String(appointment.price)).toFixed(2)}</TableCell> {/* POPRAWKA TUTAJ */}
                                        <TableCell>
                                            <Badge className={getStatusBadgeVariant(appointment.status)}>
                                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex space-x-1 justify-end">
                                                {appointment.status === "pending" && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleStatusChange(appointment.id, "confirmed")}
                                                            title="Confirm"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleStatusChange(appointment.id, "canceled")}
                                                            title="Cancel"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {appointment.status === "confirmed" && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleStatusChange(appointment.id, "completed")}
                                                            title="Mark as Completed"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50" // Zmieniono kolor na pomarańczowy
                                                            onClick={() => handleStatusChange(appointment.id, "no-show")}
                                                            title="Mark as No Show"
                                                        >
                                                            <User className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {filteredAppointments.length === 0 && (
                        <div className="text-center py-8">
                            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
        </DashboardLayout>
    );
};

export default BarberAppointments;