import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MuiCalendar from "@/components/ui/mui-calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    CalendarDays as CalendarIcon,
    Clock,
    CheckCircle,
    User as UserIcon,
    ShoppingBag,
    Scissors,
} from "lucide-react";
import { toast } from "sonner";
import { format, isValid as isValidDateFn } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import dayjs from "dayjs";
import "dayjs/locale/pl";

dayjs.locale("pl");

interface Service {
    id: number;
    name: string;
    description: string;
    duration: number;
    price: number;
    image?: string;
}

interface Barber {
    id: number;
    name: string;
    role?: string;
    rating?: number;
    experience?: number;
    image?: string;
}

interface BookingFormData {
    date: Date | undefined;
    timeSlot: string | null;
    serviceId: number | null;
    barberId: number | null;
    firstName: string;
    lastName: string;
    email: string;
    notes: string;
    termsAccepted: boolean;
}

const Booking = () => {
    useRequireAuth({ allowedRoles: ["client"] });
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<number>(1);
    const [services, setServices] = useState<Service[]>([]);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

    const [formData, setFormData] = useState<BookingFormData>({
        date: undefined,
        timeSlot: null,
        serviceId: null,
        barberId: null,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        notes: "",
        termsAccepted: false,
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (token) {
            const fetchServices = async () => {
                setIsLoadingServices(true);
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/booking/services`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (!response.ok) throw new Error("Nie udało się pobrać usług");
                    const data = await response.json();
                    setServices(data);
                } catch (error) {
                    toast.error("Nie udało się wczytać usług. Spróbuj ponownie.");
                    console.error(error);
                } finally {
                    setIsLoadingServices(false);
                }
            };
            fetchServices();
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            const fetchBarbers = async () => {
                setIsLoadingBarbers(true);
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/booking/barbers`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (!response.ok) throw new Error("Nie udało się pobrać barberów");
                    const data = await response.json();
                    setBarbers(data);
                } catch (error) {
                    toast.error("Nie udało się wczytać barberów. Spróbuj ponownie.");
                    console.error(error);
                } finally {
                    setIsLoadingBarbers(false);
                }
            };
            fetchBarbers();
        }
    }, [token]);

    useEffect(() => {
        if (token && formData.date && formData.serviceId && formData.barberId) {
            const fetchAvailableTimeSlots = async () => {
                setIsLoadingTimeSlots(true);
                setFormData(prev => ({ ...prev, timeSlot: null }));
                try {
                    const selectedService = services.find(
                        s => s.id === formData.serviceId
                    );
                    if (!selectedService) {
                        setAvailableTimeSlots([]);
                        setIsLoadingTimeSlots(false);
                        return;
                    }
                    const queryParams = new URLSearchParams({
                        date: format(formData.date!, "yyyy-MM-dd"),
                        serviceId: String(formData.serviceId),
                        barberId: String(formData.barberId),
                    });
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/booking/availability?${queryParams.toString()}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    if (!response.ok)
                        throw new Error("Nie udało się pobrać dostępnych godzin");
                    const data = await response.json();
                    setAvailableTimeSlots(data);
                } catch (error) {
                    toast.error("Nie udało się wczytać dostępnych godzin.");
                    console.error(error);
                    setAvailableTimeSlots([]);
                } finally {
                    setIsLoadingTimeSlots(false);
                }
            };
            fetchAvailableTimeSlots();
        } else {
            setAvailableTimeSlots([]);
        }
    }, [token, formData.date, formData.serviceId, formData.barberId, services]);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName || prev.firstName || "",
                lastName: user.lastName || prev.lastName || "",
                email: user.email || prev.email || "",

            }));
        }
    }, [user]);

    const validateStep = (currentStep: number): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (currentStep === 1) {
            if (!formData.serviceId)
                newErrors.serviceId = "Wybierz usługę";
        } else if (currentStep === 2) {
            if (!formData.barberId)
                newErrors.barberId = "Wybierz barbera";
        } else if (currentStep === 3) {
            if (!formData.date)
                newErrors.date = "Wybierz datę wizyty";
            if (!formData.timeSlot)
                newErrors.timeSlot = "Wybierz godzinę wizyty";
        } else if (currentStep === 4) {
            if (!formData.firstName)
                newErrors.firstName = "Imię jest wymagane";
            if (!formData.lastName)
                newErrors.lastName = "Nazwisko jest wymagane";
            if (!formData.email) {
                newErrors.email = "Adres e‑mail jest wymagany";
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "Adres e‑mail jest nieprawidłowy";
            }

            if (!formData.termsAccepted)
                newErrors.termsAccepted =
                    "Musisz zaakceptować regulamin i warunki wizyty";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
            window.scrollTo(0, 0);
        } else {
            toast.error("Uzupełnij wymagane pola na tym etapie.");
        }
    };

    const handleBack = () => {
        setStep(step - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(4) || !token) {
            if (!token)
                toast.error("Błąd uwierzytelniania. Zaloguj się ponownie.");
            else
                toast.error(
                    "Upewnij się, że wszystkie dane są poprawne i zaakceptowano regulamin."
                );
            return;
        }

        const bookingPayload = {
            serviceId: formData.serviceId,
            barberId: formData.barberId,
            date: formData.date
                ? format(formData.date, "yyyy-MM-dd")
                : "",
            timeSlot: formData.timeSlot,
            notes: formData.notes,
        };

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/booking/create`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(bookingPayload),
                }
            );

            if (!response.ok) {
                let errorMsg = "Rezerwacja nie powiodła się";
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (err) {/* ignore */}
                throw new Error(errorMsg);
            }

            toast.success(
                "Rezerwacja została wysłana! Twoja wizyta oczekuje na potwierdzenie."
            );
            navigate("/user-dashboard/appointments");
        } catch (error: any) {
            toast.error(
                error.message ||
                "Nie udało się wysłać rezerwacji. Spróbuj ponownie."
            );
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateSelect = (selectedDate: Date | null) => {
        setFormData(prev => ({
            ...prev,
            date: selectedDate || undefined,
            timeSlot: null,
        }));
        setErrors(prev => ({ ...prev, date: "", timeSlot: "" }));
    };

    const getStepTitle = (): string => {
        switch (step) {
            case 1:
                return "Wybierz usługę";
            case 2:
                return "Wybierz barbera";
            case 3:
                return "Wybierz datę i godzinę";
            case 4:
                return "Twoje dane i potwierdzenie";
            default:
                return "Zarezerwuj wizytę";
        }
    };

    const getSelectedService = (): Service | undefined =>
        services.find(s => s.id === formData.serviceId);
    const getSelectedBarber = (): Barber | undefined =>
        barbers.find(b => b.id === formData.barberId);

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <Label className="text-base font-medium">
                            Wybierz usługę
                        </Label>
                        {isLoadingServices ? (
                            <p>Ładowanie usług...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {services.map(service => (
                                    <Card
                                        key={service.id}
                                        className={cn(
                                            "cursor-pointer transition-all hover:shadow-lg",
                                            formData.serviceId === service.id
                                                ? "ring-2 ring-barber shadow-lg"
                                                : "hover:border-gray-300"
                                        )}
                                        onClick={() =>
                                            setFormData(prev => ({
                                                ...prev,
                                                serviceId: service.id,
                                                barberId: null,
                                                date: undefined,
                                                timeSlot: null,
                                            }))
                                        }
                                    >
                                        <CardContent className="p-4 flex items-start space-x-4">
                                            {service.image && (
                                                <img
                                                    src={service.image}
                                                    alt={service.name}
                                                    className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-gray-800">
                                                        {service.name}
                                                    </h3>
                                                    <p className="font-semibold text-barber">
                                                        {service.price.toFixed(
                                                            2
                                                        )}{" "}
                                                        PLN
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {service.description}
                                                </p>
                                                <div className="mt-1.5 flex items-center text-xs text-gray-500">
                                                    <Clock className="inline-block h-3.5 w-3.5 mr-1" />{" "}
                                                    {service.duration} min
                                                </div>
                                            </div>
                                            {formData.serviceId ===
                                                service.id && (
                                                    <CheckCircle className="h-5 w-5 text-barber flex-shrink-0 ml-2" />
                                                )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        {errors.serviceId && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.serviceId}
                            </p>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <Label className="text-base font-medium">
                            Wybierz barbera
                        </Label>
                        {isLoadingBarbers ? (
                            <p>Ładowanie barberów...</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {barbers.map(barber => (
                                    <Card
                                        key={barber.id}
                                        className={cn(
                                            "cursor-pointer transition-all hover:shadow-lg text-center",
                                            formData.barberId === barber.id
                                                ? "ring-2 ring-barber shadow-lg"
                                                : "hover:border-gray-300"
                                        )}
                                        onClick={() =>
                                            setFormData(prev => ({
                                                ...prev,
                                                barberId: barber.id,
                                                date: undefined,
                                                timeSlot: null,
                                            }))
                                        }
                                    >
                                        <CardContent className="p-4 flex flex-col items-center">
                                            {barber.image && (
                                                <img
                                                    src={barber.image}
                                                    alt={barber.name}
                                                    className="w-20 h-20 object-cover rounded-full mb-2"
                                                />
                                            )}
                                            <h3 className="font-semibold text-gray-800">
                                                {barber.name}
                                            </h3>
                                            {barber.role && (
                                                <p className="text-xs text-barber">
                                                    {barber.role}
                                                </p>
                                            )}
                                            {formData.barberId ===
                                                barber.id && (
                                                    <CheckCircle className="h-5 w-5 text-barber mt-2" />
                                                )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        {errors.barberId && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.barberId}
                            </p>
                        )}
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <Label className="text-base font-medium">
                                Wybierz datę
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal mt-1",
                                            !formData.date &&
                                            "text-muted-foreground",
                                            errors.date && "border-red-500"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.date &&
                                        isValidDateFn(formData.date)
                                            ? format(formData.date, "PPP", {
                                                locale: pl,
                                            })
                                            : "Wybierz datę"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <MuiCalendar
                                        value={formData.date || null}
                                        onChange={handleDateSelect}
                                        shouldDisableDate={day =>
                                            day.isBefore(
                                                dayjs().startOf("day")
                                            )
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.date && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.date}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label className="text-base font-medium">
                                Wybierz godzinę
                            </Label>
                            {isLoadingTimeSlots ? (
                                <p className="text-sm text-gray-500 mt-1">
                                    Ładowanie dostępnych godzin...
                                </p>
                            ) : availableTimeSlots.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
                                    {availableTimeSlots.map(time => (
                                        <Button
                                            key={time}
                                            type="button"
                                            variant={
                                                formData.timeSlot === time
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className={cn(
                                                "w-full",
                                                formData.timeSlot === time
                                                    ? "bg-barber hover:bg-barber-muted"
                                                    : ""
                                            )}
                                            onClick={() =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    timeSlot: time,
                                                }))
                                            }
                                        >
                                            <Clock className="w-4 h-4 mr-2" />{" "}
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 mt-1">
                                    {formData.date &&
                                    formData.serviceId &&
                                    formData.barberId
                                        ? "Brak dostępnych terminów dla wybranej daty/usługi/barbera."
                                        : "Najpierw wybierz usługę, barbera i datę."}
                                </p>
                            )}
                            {errors.timeSlot && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.timeSlot}
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="firstName">Imię</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={
                                        errors.firstName ? "border-red-500" : ""
                                    }
                                />
                                {errors.firstName && (
                                    <p className="text-red-500 text-xs">
                                        {errors.firstName}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lastName">Nazwisko</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={
                                        errors.lastName ? "border-red-500" : ""
                                    }
                                />
                                {errors.lastName && (
                                    <p className="text-red-500 text-xs">
                                        {errors.lastName}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">E‑mail</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={
                                        errors.email ? "border-red-500" : ""
                                    }
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="notes">
                                Dodatkowe uwagi (opcjonalnie)
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Np. preferowana długość brody, wrażliwa skóra itp."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-barber focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-start space-x-2 pt-2">
                            <Checkbox
                                id="termsAccepted"
                                checked={formData.termsAccepted}
                                onCheckedChange={checked =>
                                    setFormData(prev => ({
                                        ...prev,
                                        termsAccepted: Boolean(checked),
                                    }))
                                }
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="termsAccepted"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Akceptuję regulamin i warunki wizyty
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    Wizytę możesz odwołać lub przełożyć
                                    najpóźniej 24 godziny przed jej terminem.
                                </p>
                                {errors.termsAccepted && (
                                    <p className="text-red-500 text-xs">
                                        {errors.termsAccepted}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const progressPercentage = Math.min((step / 4) * 100, 100);
    const currentService = getSelectedService();
    const currentBarber = getSelectedBarber();
    const totalCost = currentService ? currentService.price * 1.1 : 0;

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
                            Zarezerwuj wizytę
                        </h1>
                        <p className="text-center text-gray-500 text-sm sm:text-base mb-6">
                            Przejdź przez kolejne kroki, aby zaplanować swoją
                            wizytę.
                        </p>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between text-xs">
                                <div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            step >= 1
                                                ? "bg-barber text-white"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        Usługa
                                    </span>
                                </div>
                                <div
                                    className={`flex-auto border-t-2 transition-all duration-500 ease-in-out mx-2 ${
                                        step > 1
                                            ? "border-barber"
                                            : "border-gray-200"
                                    }`}
                                ></div>
                                <div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            step >= 2
                                                ? "bg-barber text-white"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        Barber
                                    </span>
                                </div>
                                <div
                                    className={`flex-auto border-t-2 transition-all duration-500 ease-in-out mx-2 ${
                                        step > 2
                                            ? "border-barber"
                                            : "border-gray-200"
                                    }`}
                                ></div>
                                <div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            step >= 3
                                                ? "bg-barber text-white"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        Data i godzina
                                    </span>
                                </div>
                                <div
                                    className={`flex-auto border-t-2 transition-all duration-500 ease-in-out mx-2 ${
                                        step > 3
                                            ? "border-barber"
                                            : "border-gray-200"
                                    }`}
                                ></div>
                                <div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            step >= 4
                                                ? "bg-barber text-white"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        Potwierdzenie
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-200">
                                <div
                                    style={{ width: `${progressPercentage}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-barber transition-all duration-500"
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            <div className="md:col-span-2">
                                <Card className="animate-fade-in shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-semibold text-gray-700">
                                            {getStepTitle()}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSubmit}>
                                            {renderStepContent()}
                                        </form>
                                        <div className="flex justify-between mt-8">
                                            {step > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleBack}
                                                >
                                                    Wstecz
                                                </Button>
                                            )}
                                            {step < 4 ? (
                                                <Button
                                                    type="button"
                                                    className="bg-barber hover:bg-barber-muted ml-auto"
                                                    onClick={handleNext}
                                                >
                                                    Dalej
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="submit"
                                                    className="bg-barber hover:bg-barber-muted ml-auto"
                                                    onClick={handleSubmit}
                                                    disabled={
                                                        !formData.termsAccepted
                                                    }
                                                >
                                                    Potwierdź rezerwację
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="md:col-span-1 sticky top-24">
                                <Card className="shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold text-barber">
                                            Podsumowanie wizyty
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div>
                                            <Label className="text-xs text-gray-500">
                                                Usługa
                                            </Label>
                                            <p className="font-medium text-gray-700">
                                                {currentService?.name ||
                                                    "Nie wybrano"}
                                            </p>
                                            {currentService && (
                                                <p className="text-xs text-gray-500">
                                                    {currentService.duration}{" "}
                                                    min –{" "}
                                                    {currentService.price.toFixed(
                                                        2
                                                    )}{" "}
                                                    PLN
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500">
                                                Barber
                                            </Label>
                                            <p className="font-medium text-gray-700">
                                                {currentBarber?.name ||
                                                    "Nie wybrano"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500">
                                                Data i godzina
                                            </Label>
                                            <p className="font-medium text-gray-700">
                                                {formData.date &&
                                                isValidDateFn(formData.date)
                                                    ? format(
                                                        formData.date,
                                                        "PPP",
                                                        { locale: pl }
                                                    )
                                                    : "Nie wybrano"}
                                                {formData.timeSlot
                                                    ? `, ${formData.timeSlot}`
                                                    : ""}
                                            </p>
                                        </div>
                                        {(formData.firstName ||
                                                formData.lastName) &&
                                            step === 4 && (
                                                <div>
                                                    <Label className="text-xs text-gray-500">
                                                        Klient
                                                    </Label>
                                                    <p className="font-medium text-gray-700">
                                                        {formData.firstName}{" "}
                                                        {formData.lastName}
                                                    </p>
                                                </div>
                                            )}
                                        {step === 4 && currentService && (
                                            <div className="pt-3 border-t mt-3">
                                                <div className="flex justify-between">
                                                    <p>Suma netto:</p>
                                                    <p>
                                                        {currentService.price.toFixed(
                                                            2
                                                        )}{" "}
                                                        PLN
                                                    </p>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <p>
                                                        Szacowany podatek (10%):
                                                    </p>
                                                    <p>
                                                        {(
                                                            currentService.price *
                                                            0.1
                                                        ).toFixed(2)}{" "}
                                                        PLN
                                                    </p>
                                                </div>
                                                <div className="flex justify-between font-bold text-md mt-2 text-barber">
                                                    <p>Razem:</p>
                                                    <p>
                                                        {totalCost.toFixed(2)}{" "}
                                                        PLN
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Booking;
