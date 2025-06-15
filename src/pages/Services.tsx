// src/pages/Services.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Clock,
    Star, // Możemy zostawić, jeśli planujesz dodać system ocen w przyszłości
    Calendar,
    Loader2,
    Scissors, // Domyślna ikona usługi
    Zap, // Przykładowa ikona dla 'Beard'
    Smile, // Przykładowa ikona dla 'Facial'
    Heart // Przykładowa ikona dla 'Kids'
} from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { format } from "date-fns"; // Jeśli będziesz potrzebował formatować daty

// Zaktualizowany interfejs
interface Service {
    id: number;
    name: string;
    description: string;
    duration: number;
    price: number;
    image: string | null; // Pozostawiamy, backend to zwraca jako photo_url
    icon?: React.ElementType; // Dodajemy opcjonalną ikonę
    category?: string; // Opcjonalna kategoria do mapowania ikon
}

// Mapa ikon dla różnych typów usług (można rozbudować)
const serviceIconMap: Record<string, React.ElementType> = {
    haircut: Scissors,
    beard: Zap, // Przykład
    facial: Smile, // Przykład
    kids: Heart, // Przykład
    default: Scissors,
};

// Funkcja do przypisywania ikon na podstawie np. nazwy lub przyszłej kategorii
const assignIconToService = (service: Service): Service => {
    let assignedIcon = serviceIconMap.default;
    const serviceNameLower = service.name.toLowerCase();

    if (serviceNameLower.includes("haircut") || serviceNameLower.includes("cut")) {
        assignedIcon = serviceIconMap.haircut;
    } else if (serviceNameLower.includes("beard")) {
        assignedIcon = serviceIconMap.beard;
    } else if (serviceNameLower.includes("facial") || serviceNameLower.includes("shave")) {
        assignedIcon = serviceIconMap.facial;
    } else if (serviceNameLower.includes("kid")) {
        assignedIcon = serviceIconMap.kids;
    }
    // Możesz tu dodać więcej logiki lub użyć pola 'category' jeśli je dodasz
    return { ...service, icon: assignedIcon };
};


const ServicesPage = () => { // Zmieniono nazwę komponentu
    const [services, setServicesData] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>("all"); // Na razie nie używamy

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/services`);
                if (!response.ok) {
                    throw new Error("Failed to fetch services from API");
                }
                let data: Service[] = await response.json();
                // Przypisz ikony do usług
                data = data.map(assignIconToService);
                setServicesData(data);
            } catch (error) {
                console.error("Error fetching services:", error);
                toast.error("Could not load services. Please try again later.");
                setServicesData([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    // const filteredServices = selectedCategory === "all"
    //     ? services
    //     : services.filter(service => service.category === selectedCategory);
    const filteredServices = services;


    // const categories = [
    //     { id: "all", name: "All Services" },
    //     // ... (reszta kategorii, jeśli będziesz używać)
    // ];

    return (
        <Layout>
            {/* Hero Section (bez zmian) */}
            <section className="relative py-24 md:py-32">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1622288432428-5937a421a05c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80')",
                    }}
                ></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
                        Our Services
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                        From classic cuts to premium grooming treatments, we offer a range of
                        services designed for the modern gentleman.
                    </p>
                </div>
            </section>

            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    {/* Category Filters - zakomentowane na razie */}
                    {/* <div className="flex flex-wrap gap-4 justify-center mb-12">
                        {categories.map(category => (
                            <Button
                                key={category.id}
                                // onClick={() => setSelectedCategory(category.id as ServiceCategory)}
                                // variant={selectedCategory === category.id ? "default" : "outline"}
                                // className={selectedCategory === category.id ? "bg-barber hover:bg-barber-muted" : "border-barber text-barber-dark hover:bg-barber hover:text-white"}
                            >
                                {category.name}
                            </Button>
                        ))}
                    </div> */}

                    {isLoading ? (
                        <div className="text-center py-10">
                            <Loader2 className="h-12 w-12 text-barber animate-spin mx-auto" />
                            <p className="mt-3 text-gray-600">Loading services...</p>
                        </div>
                    ) : filteredServices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredServices.map((service, index) => {
                                const ServiceIcon = service.icon || Scissors; // Domyślna ikona, jeśli nie przypisano
                                return (
                                    <div
                                        key={service.id}
                                        className="bg-white rounded-lg border-2 border-gray-100 hover:border-barber/30 hover:shadow-xl transition-all duration-300 card-hover animate-fade-in flex flex-col" // Dodano flex flex-col
                                        style={{ animationDelay: `${0.1 * index}s` }}
                                    >
                                        <div className="p-6 flex-grow flex flex-col"> {/* Dodano flex-grow i flex-col */}
                                            <div className="w-16 h-16 bg-barber/10 rounded-full flex items-center justify-center mb-5 self-center"> {/* Dodano self-center */}
                                                <ServiceIcon className="h-8 w-8 text-barber" />
                                            </div>

                                            <h3 className="text-xl font-semibold mb-3 text-barber-dark text-center">
                                                {service.name}
                                            </h3>

                                            <p className="text-gray-600 mb-4 text-sm min-h-[4.5rem] line-clamp-3 flex-grow"> {/* line-clamp-3 dla 3 linii */}
                                                {service.description}
                                            </p>

                                            <div className="flex items-center justify-between text-sm text-gray-700 mb-4 mt-auto"> {/* mt-auto dla wypchnięcia w dół */}
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 text-barber mr-1.5" />
                                                    <span>{service.duration} min</span>
                                                </div>
                                                {/* Można dodać placeholder dla gwiazdek, jeśli planujesz oceny usług */}
                                                {/* <div className="flex items-center">
                                                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                                    <span>{service.rating || "N/A"}</span>
                                                </div> */}
                                            </div>

                                            <div className="border-t pt-4 flex items-center justify-between">
                                                <span className="text-2xl font-bold text-barber">
                                                    ${service.price.toFixed(2)}
                                                </span>
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    className="bg-barber hover:bg-barber-muted text-white"
                                                >
                                                    <Link to={`/booking?serviceId=${service.id}`}>
                                                        <Calendar className="h-4 w-4 mr-2" /> Book Now
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Scissors className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">No services available at the moment.</p>
                            <p className="text-gray-500">Please check back later.</p>
                        </div>
                    )}
                </div>
            </section>
        </Layout>
    );
};

export default ServicesPage;