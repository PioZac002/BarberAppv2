// src/pages/barber-dashboard/BarberAppointments.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays as CalendarIcon, Filter, Check, X, User as UserIconLucide, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCard } from "@/components/ui/table";
import { isValid, format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Appointment {
    id: number;
    client_name: string;
    client_phone: string;
    service_name: string;
    price: number | string;
    appointment_time: string;
    status: string;
}

const BarberAppointmentsPage = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");
    const [isLoadingData, setIsLoadingData] = useState(true);

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
            let url = `${import.meta.env.VITE_API_URL}/api/barber/appointments`;
            const params = new URLSearchParams();
            if (timeFilter !== "all") {
                params.append("upcoming", timeFilter === "upcoming" ? "true" : "false");
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Nie udało się pobrać wizyt" }));
                    throw new Error(errorData.error || "Nie udało się pobrać wizyt");
                }
                const data = await response.json();
                data.sort((a: Appointment, b: Appointment) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
                setAppointments(data);
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "Nie udało się wczytać wizyt");
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchAppointments();
    }, [authUser, token, timeFilter, authContextLoading]);

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': case 'canceled': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'no-show': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'Oczekujące';
            case 'confirmed': return 'Potwierdzone';
            case 'completed': return 'Zrealizowane';
            case 'canceled': case 'cancelled': return 'Anulowane';
            case 'no-show': return 'Nieobecność';
            default: return status;
        }
    };

    const filteredAppointments = appointments.filter((appointment) =>
        statusFilter === "all" || appointment.status.toLowerCase() === statusFilter.toLowerCase()
    );

    const handleStatusChangeUpdated = async (appointmentId: number, newStatus: string) => {
        if (!token) {
            toast.error("Błąd uwierzytelnienia.");
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/appointments/${appointmentId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Nie udało się zaktualizować statusu" }));
                throw new Error(errorData.error || "Nie udało się zaktualizować statusu wizyty");
            }
            setAppointments((prev) =>
                prev.map((apt) =>
                    apt.id === appointmentId ? { ...apt, status: newStatus } : apt
                ).sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime())
            );
            toast.success(`Status wizyty zaktualizowany na ${getStatusLabel(newStatus)}`);
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error(error.message || "Nie udało się zaktualizować statusu wizyty");
        }
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const mobileRenderUpdated = (appointment: Appointment) => (
        <TableCard key={appointment.id}>
            <div className="flex flex-col space-y-2 p-4">
                <div className="flex justify-between items-center">
                    <span className="font-medium">{appointment.client_name}</span>
                    <Badge className={getStatusBadgeVariant(appointment.status)}>
                        {getStatusLabel(appointment.status)}
                    </Badge>
                </div>
                <div className="text-sm text-gray-600">{appointment.service_name}</div>
                <div className="text-sm text-gray-500">
                    {isValid(new Date(appointment.appointment_time))
                        ? format(new Date(appointment.appointment_time), 'PPpp', { locale: pl })
                        : 'Nieprawidłowa data'}
                </div>
                <div className="text-xs text-gray-500">Tel: {appointment.client_phone || "Brak"}</div>
                <div className="text-sm text-gray-600">
                    Cena: {parseFloat(String(appointment.price)).toFixed(2)} PLN
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                    {appointment.status === "pending" && (
                        <>
                            <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white w-full"
                                onClick={() => handleStatusChangeUpdated(appointment.id, "confirmed")}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Potwierdź
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50 w-full"
                                onClick={() => handleStatusChangeUpdated(appointment.id, "canceled")}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Anuluj
                            </Button>
                        </>
                    )}
                    {appointment.status === "confirmed" && (
                        <>
                            <Button
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600 text-white w-full"
                                onClick={() => handleStatusChangeUpdated(appointment.id, "completed")}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Zakończ
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-500 text-orange-500 hover:bg-orange-50 w-full"
                                onClick={() => handleStatusChangeUpdated(appointment.id, "no-show")}
                            >
                                <UserIconLucide className="h-4 w-4 mr-1" />
                                Nieobecność
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </TableCard>
    );

    if (authContextLoading || isLoadingData) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 border-b pb-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center text-xl sm:text-2xl">
                        <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-barber" />
                        Zarządzanie wizytami
                    </CardTitle>
                    <CardDescription>Przeglądaj i zarządzaj wizytami swoich klientów.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-gray-500 hidden sm:block" />
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-full sm:w-36 h-9 text-xs sm:text-sm">
                            <SelectValue placeholder="Filtruj według czasu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszystkie czasy</SelectItem>
                            <SelectItem value="upcoming">Nadchodzące</SelectItem>
                            <SelectItem value="past">Przeszłe</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40 h-9 text-xs sm:text-sm">
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
                </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
                {isMobile ? (
                    <div className="space-y-4">
                        {filteredAppointments.length > 0 ?
                            filteredAppointments.map(mobileRenderUpdated) :
                            (
                                <div className="text-center py-10 col-span-full">
                                    <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Brak wizyt spełniających wybrane kryteria.</p>
                                </div>
                            )
                        }
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Klient</TableHead>
                                <TableHead>Usługa</TableHead>
                                <TableHead>Data i godzina</TableHead>
                                <TableHead>Cena</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAppointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{appointment.client_name}</div>
                                            <div className="text-sm text-gray-500">{appointment.client_phone || "Brak"}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{appointment.service_name}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div>
                                                {isValid(new Date(appointment.appointment_time))
                                                    ? format(new Date(appointment.appointment_time), "PP", { locale: pl })
                                                    : 'Nieprawidłowa data'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {isValid(new Date(appointment.appointment_time))
                                                    ? format(new Date(appointment.appointment_time), "p", { locale: pl })
                                                    : ''}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{parseFloat(String(appointment.price)).toFixed(2)} PLN</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusBadgeVariant(appointment.status)}>
                                            {getStatusLabel(appointment.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex space-x-1 justify-end">
                                            {appointment.status === "pending" && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8"
                                                        onClick={() => handleStatusChangeUpdated(appointment.id, "confirmed")}
                                                        title="Potwierdź"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                        onClick={() => handleStatusChangeUpdated(appointment.id, "canceled")}
                                                        title="Anuluj"
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
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                                                        onClick={() => handleStatusChangeUpdated(appointment.id, "completed")}
                                                        title="Oznacz jako zakończone"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 w-8"
                                                        onClick={() => handleStatusChangeUpdated(appointment.id, "no-show")}
                                                        title="Oznacz jako nieobecność"
                                                    >
                                                        <UserIconLucide className="h-4 w-4" />
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

                {filteredAppointments.length === 0 && !isLoadingData && (
                    <div className="text-center py-12">
                        <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Nie znaleziono wizyt</h3>
                        <p className="text-gray-500">
                            {statusFilter === "all" && timeFilter === "all"
                                ? "Obecnie nie masz żadnych wizyt."
                                : "Brak wizyt spełniających wybrane kryteria."}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default BarberAppointmentsPage;
