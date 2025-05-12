import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Calendar from "@/components/ui/calendar"; // Poprawiony import
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

// Typowanie dla usług i fryzjerów
interface Service {
    id: number;
    name: string;
    description: string;
    duration: number;
    rating: number;
    price: number;
    category: string;
    image: string;
}

interface Barber {
    id: number;
    name: string;
    role: string;
    rating: number;
    experience: number;
    image: string;
}

// Dane przykładowe
const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
];

const services: Service[] = [
    {
        id: 1,
        name: "Classic Haircut",
        description: "Traditional haircut with precision scissor work and styling.",
        duration: 45,
        rating: 4.8,
        price: 35,
        category: "haircut",
        image: "https://images.unsplash.com/photo-1521499892833-773a6c6fd0b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 2,
        name: "Beard Trim & Shape",
        description: "Expert beard trimming and shaping to perfect your facial hair.",
        duration: 30,
        rating: 4.9,
        price: 25,
        category: "beard",
        image: "https://images.unsplash.com/photo-1621605810052-80936562dcb4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 3,
        name: "Hot Towel Shave",
        description: "Luxurious straight razor shave with hot towels and premium products.",
        duration: 45,
        rating: 5.0,
        price: 40,
        category: "facial",
        image: "https://images.unsplash.com/photo-1599188574942-a6970f7a6137?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 4,
        name: "Haircut & Beard Combo",
        description: "Complete package including haircut and beard trimming.",
        duration: 60,
        rating: 4.7,
        price: 55,
        category: "haircut",
        image: "https://images.unsplash.com/photo-1599351431613-18ef1fdd09e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
];

const barbers: Barber[] = [
    {
        id: 1,
        name: "David Mitchell",
        role: "Master Barber",
        rating: 4.9,
        experience: 12,
        image: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 2,
        name: "Sarah Johnson",
        role: "Style Specialist",
        rating: 4.8,
        experience: 8,
        image: "https://images.unsplash.com/photo-1595110045835-8dcc5c8bfa6d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    {
        id: 3,
        name: "Michael Rodriguez",
        role: "Beard Expert",
        rating: 5.0,
        experience: 10,
        image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    },
];

interface BookingFormData {
    date: Date | undefined;
    timeSlot: string | null;
    service: number | null;
    barber: number | null;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes: string;
}

const Booking = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<number>(1);
    const [date, setDate] = useState<Date | undefined>(undefined); // Dodany stan dla daty
    const [formData, setFormData] = useState<BookingFormData>({
        date: undefined,
        timeSlot: null,
        service: null,
        barber: null,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: "",
        notes: "",
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateStep = (currentStep: number): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (currentStep === 1) {
            if (!formData.date) {
                newErrors.date = "Please select a date";
            }
            if (!formData.timeSlot) {
                newErrors.timeSlot = "Please select a time slot";
            }
        } else if (currentStep === 2) {
            if (!formData.service) {
                newErrors.service = "Please select a service";
            }
        } else if (currentStep === 3) {
            if (!formData.barber) {
                newErrors.barber = "Please select a barber";
            }
        } else if (currentStep === 4) {
            if (!formData.firstName) {
                newErrors.firstName = "First name is required";
            }
            if (!formData.lastName) {
                newErrors.lastName = "Last name is required";
            }
            if (!formData.email) {
                newErrors.email = "Email is required";
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "Email is invalid";
            }
            if (!formData.phone) {
                newErrors.phone = "Phone number is required";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateStep(4)) {
            return;
        }

        // TODO: Replace with API call to submit booking
        setTimeout(() => {
            toast.success("Booking submitted successfully!");

            // If user is authenticated, redirect to dashboard
            if (isAuthenticated) {
                navigate("/user-dashboard");
            } else {
                navigate("/");
            }
        }, 1500);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Funkcja aktualizująca datę w formData
    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        setFormData((prev) => ({ ...prev, date: selectedDate }));
    };

    // Renderowanie treści w zależności od kroku
    const renderStepContent = () => {
        switch (step) {
            case 1: // Wybór daty i godziny
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Wybierz datę</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.date && "text-muted-foreground",
                                            errors.date && "border-red-500"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.date ? (
                                            format(formData.date, "PPP")
                                        ) : (
                                            <span>Wybierz datę</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={handleDateSelect}
                                        disabled={(date: Date) => date < new Date()}
                                        className="rounded-md border"
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Wybierz godzinę</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {timeSlots.map((time) => (
                                    <div key={time} className={errors.timeSlot ? "animate-shake" : ""}>
                                        <Button
                                            type="button"
                                            variant={formData.timeSlot === time ? "default" : "outline"}
                                            className={cn(
                                                "w-full",
                                                formData.timeSlot === time ? "bg-barber hover:bg-barber-muted" : ""
                                            )}
                                            onClick={() =>
                                                setFormData((prev) => ({ ...prev, timeSlot: time }))
                                            }
                                        >
                                            <Clock className="w-4 h-4 mr-2" /> {time}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {errors.timeSlot && (
                                <p className="text-red-500 text-sm">{errors.timeSlot}</p>
                            )}
                        </div>
                    </div>
                );

            case 2: // Wybór usługi
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Wybierz usługę</Label>
                            <div className="grid grid-cols-1 gap-4">
                                {services.map((service) => (
                                    <div
                                        key={service.id}
                                        className={cn(
                                            "flex border rounded-md p-4 cursor-pointer transition-colors",
                                            formData.service === service.id
                                                ? "border-barber bg-barber/5"
                                                : "border-gray-200 hover:border-barber"
                                        )}
                                        onClick={() =>
                                            setFormData((prev) => ({ ...prev, service: service.id }))
                                        }
                                    >
                                        <div className="h-16 w-16 flex-shrink-0">
                                            <img
                                                src={service.image}
                                                alt={service.name}
                                                className="h-full w-full object-cover rounded"
                                            />
                                        </div>
                                        <div className="ml-4 flex-grow">
                                            <div className="flex justify-between">
                                                <h3 className="font-medium">{service.name}</h3>
                                                <p className="font-semibold text-barber">${service.price}</p>
                                            </div>
                                            <p className="text-sm text-gray-500">{service.description}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <p className="text-sm text-gray-500">
                                                    <Clock className="inline-block h-4 w-4 mr-1" />{" "}
                                                    {service.duration} min
                                                </p>
                                                {formData.service === service.id && (
                                                    <CheckCircle className="h-5 w-5 text-barber" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.service && (
                                <p className="text-red-500 text-sm">{errors.service}</p>
                            )}
                        </div>
                    </div>
                );

            case 3: // Wybór fryzjera
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Wybierz fryzjera</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {barbers.map((barber) => (
                                    <div
                                        key={barber.id}
                                        className={cn(
                                            "border rounded-md p-4 cursor-pointer transition-colors",
                                            formData.barber === barber.id
                                                ? "border-barber bg-barber/5"
                                                : "border-gray-200 hover:border-barber"
                                        )}
                                        onClick={() =>
                                            setFormData((prev) => ({ ...prev, barber: barber.id }))
                                        }
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="h-24 w-24 rounded-full overflow-hidden mb-3">
                                                <img
                                                    src={barber.image}
                                                    alt={barber.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <h3 className="font-medium text-center">{barber.name}</h3>
                                            <p className="text-sm text-barber text-center">{barber.role}</p>
                                            <div className="mt-2 flex items-center">
                                                <p className="text-yellow-500 font-semibold">{barber.rating}</p>
                                                <span className="mx-1">•</span>
                                                <p className="text-sm text-gray-500">
                                                    {barber.experience} lat
                                                </p>
                                            </div>
                                            {formData.barber === barber.id && (
                                                <div className="mt-2">
                                                    <CheckCircle className="h-5 w-5 text-barber" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.barber && (
                                <p className="text-red-500 text-sm">{errors.barber}</p>
                            )}
                        </div>
                    </div>
                );

            case 4: // Informacje kontaktowe
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Imię</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={errors.firstName ? "border-red-500" : ""}
                                />
                                {errors.firstName && (
                                    <p className="text-red-500 text-sm">{errors.firstName}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Nazwisko</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={errors.lastName ? "border-red-500" : ""}
                                />
                                {errors.lastName && (
                                    <p className="text-red-500 text-sm">{errors.lastName}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm">{errors.email}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Numer telefonu</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={errors.phone ? "border-red-500" : ""}
                                />
                                {errors.phone && (
                                    <p className="text-red-500 text-sm">{errors.phone}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Specjalne życzenia (opcjonalne)</Label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-barber focus:border-transparent"
                                placeholder="Wszelkie specjalne życzenia lub uwagi dotyczące wizyty..."
                            />
                        </div>

                        <div className="flex items-start space-x-2">
                            <Checkbox id="terms" />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Zgadzam się na warunki i zasady
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    Możesz anulować lub przełożyć wizytę do 24 godzin przed terminem.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Pobieranie tytułu kroku
    const getStepTitle = (): string => {
        switch (step) {
            case 1:
                return "Wybierz datę i godzinę";
            case 2:
                return "Wybierz usługę";
            case 3:
                return "Wybierz fryzjera";
            case 4:
                return "Twoje dane";
            default:
                return "";
        }
    };

    // Pobieranie wybranych elementów do podsumowania
    const getSelectedService = (): Service | undefined => {
        return services.find((s) => s.id === formData.service);
    };

    const getSelectedBarber = (): Barber | undefined => {
        return barbers.find((b) => b.id === formData.barber);
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4">
                    {/* Pasek postępu */}
                    <div className="max-w-3xl mx-auto mb-8">
                        <h1 className="text-3xl font-bold text-center text-barber-dark mb-6">
                            Zarezerwuj wizytę
                        </h1>

                        <div className="relative">
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                <div
                                    style={{ width: `${(step / 4) * 100}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-barber transition-all duration-500"
                                />
                            </div>
                            <div className="flex justify-between">
                                <div className={`text-xs ${step >= 1 ? "text-barber" : "text-gray-500"}`}>
                                    Data i godzina
                                </div>
                                <div className={`text-xs ${step >= 2 ? "text-barber" : "text-gray-500"}`}>
                                    Usługa
                                </div>
                                <div className={`text-xs ${step >= 3 ? "text-barber" : "text-gray-500"}`}>
                                    Fryzjer
                                </div>
                                <div className={`text-xs ${step >= 4 ? "text-barber" : "text-gray-500"}`}>
                                    Potwierdzenie
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Główna treść formularza */}
                            <div className="md:col-span-2">
                                <Card className="animate-fade-in">
                                    <CardContent className="pt-6">
                                        <h2 className="text-xl font-semibold mb-4">{getStepTitle()}</h2>
                                        <form onSubmit={handleSubmit}>{renderStepContent()}</form>

                                        <div className="flex justify-between mt-8">
                                            {step > 1 && (
                                                <Button type="button" variant="outline" onClick={handleBack}>
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
                                                >
                                                    Potwierdź rezerwację
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Pasek boczny z podsumowaniem */}
                            <div className="md:col-span-1">
                                <Card>
                                    <CardContent className="pt-6">
                                        <h3 className="font-semibold mb-4 text-barber-dark">
                                            Podsumowanie rezerwacji
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Data i godzina</p>
                                                <p className="font-medium">
                                                    {formData.date ? format(formData.date, "PPP") : "Nie wybrano"}{" "}
                                                    {formData.timeSlot ? `o ${formData.timeSlot}` : ""}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Usługa</p>
                                                <p className="font-medium">
                                                    {getSelectedService() ? (
                                                        <>
                                                            {getSelectedService()!.name} - $
                                                            {getSelectedService()!.price}
                                                            <span className="block text-xs text-gray-500">
                                                                {getSelectedService()!.duration} min
                                                            </span>
                                                        </>
                                                    ) : (
                                                        "Nie wybrano"
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Fryzjer</p>
                                                <p className="font-medium">
                                                    {getSelectedBarber() ? getSelectedBarber()!.name : "Nie wybrano"}
                                                </p>
                                            </div>

                                            {(formData.firstName || formData.lastName) && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Klient</p>
                                                    <p className="font-medium">
                                                        {formData.firstName} {formData.lastName}
                                                    </p>
                                                </div>
                                            )}

                                            {step === 4 && getSelectedService() && (
                                                <div className="pt-4 border-t">
                                                    <div className="flex justify-between">
                                                        <p>Podsuma</p>
                                                        <p className="font-medium">${getSelectedService()!.price}</p>
                                                    </div>
                                                    <div className="flex justify-between mt-1">
                                                        <p>Podatek</p>
                                                        <p className="font-medium">
                                                            ${(getSelectedService()!.price * 0.1).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between mt-4 pt-4 border-t">
                                                        <p className="font-bold">Łącznie</p>
                                                        <p className="font-bold text-barber">
                                                            ${(getSelectedService()!.price * 1.1).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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