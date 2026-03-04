import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Clock,
    Calendar,
    Loader2,
    Scissors,
    Zap,
    Smile,
    Heart,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface Service {
    id: number;
    name: string;
    description: string;
    duration: number;
    price: number;
    image: string | null;
    icon?: React.ElementType;
    category?: string;
}

const serviceIconMap: Record<string, React.ElementType> = {
    haircut: Scissors,
    beard: Zap,
    facial: Smile,
    kids: Heart,
    default: Scissors,
};

const assignIconToService = (service: Service): Service => {
    let assignedIcon = serviceIconMap.default;
    const lower = service.name.toLowerCase();
    if (lower.includes("haircut") || lower.includes("cut")) {
        assignedIcon = serviceIconMap.haircut;
    } else if (lower.includes("beard")) {
        assignedIcon = serviceIconMap.beard;
    } else if (lower.includes("facial") || lower.includes("shave")) {
        assignedIcon = serviceIconMap.facial;
    } else if (lower.includes("kid")) {
        assignedIcon = serviceIconMap.kids;
    }
    return { ...service, icon: assignedIcon };
};

const ServicesPage = () => {
    const { t } = useLanguage();
    const [services, setServicesData] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/public/services`
                );
                if (!response.ok) throw new Error("Failed to fetch services");
                let data: Service[] = await response.json();
                data = data.map(assignIconToService);
                setServicesData(data);
            } catch (error) {
                console.error("Error fetching services:", error);
                toast.error(t("services.loading"));
                setServicesData([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    return (
        <Layout>
            {/* ── Hero ── */}
            <section className="relative py-24 md:py-36">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), url('https://images.unsplash.com/photo-1622288432428-5937a421a05c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80')",
                    }}
                />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
                        {t("services.title")}
                    </h1>
                    <p
                        className="text-xl text-gray-300 max-w-3xl mx-auto animate-fade-in"
                        style={{ animationDelay: "0.2s" }}
                    >
                        {t("services.subtitle")}
                    </p>
                </div>
            </section>

            {/* ── Services grid ── */}
            <section className="py-16 bg-background">
                <div className="container mx-auto px-4">
                    {isLoading ? (
                        <div className="text-center py-16">
                            <Loader2 className="h-12 w-12 text-barber animate-spin mx-auto" />
                            <p className="mt-4 text-muted-foreground">{t("services.loading")}</p>
                        </div>
                    ) : services.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((service, index) => {
                                const ServiceIcon = service.icon || Scissors;
                                return (
                                    <div
                                        key={service.id}
                                        className="bg-card rounded-xl border border-border hover:border-barber/40 hover:shadow-xl transition-all duration-300 flex flex-col animate-fade-in"
                                        style={{ animationDelay: `${0.08 * index}s` }}
                                    >
                                        <div className="p-6 flex-grow flex flex-col">
                                            <div className="w-16 h-16 bg-barber/10 dark:bg-barber/20 rounded-full flex items-center justify-center mb-5 self-center">
                                                <ServiceIcon className="h-8 w-8 text-barber" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-3 text-foreground text-center">
                                                {service.name}
                                            </h3>
                                            <p className="text-muted-foreground mb-4 text-sm min-h-[4.5rem] line-clamp-3 flex-grow">
                                                {service.description}
                                            </p>
                                            <div className="flex items-center text-sm text-muted-foreground mb-4 mt-auto">
                                                <Clock className="h-4 w-4 text-barber mr-1.5" />
                                                <span>
                                                    {service.duration} {t("services.duration")}
                                                </span>
                                            </div>
                                            <div className="border-t border-border pt-4 flex items-center justify-between">
                                                <span className="text-2xl font-bold text-barber">
                                                    {service.price.toFixed(2)} PLN
                                                </span>
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    className="bg-barber hover:bg-barber-muted text-white"
                                                >
                                                    <Link to={`/booking?serviceId=${service.id}`}>
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        {t("services.bookAppointment")}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <Scissors className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                            <p className="text-foreground text-lg font-medium">
                                {t("services.noServices")}
                            </p>
                            <p className="text-muted-foreground mt-1">
                                {t("services.noServicesHint")}
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </Layout>
    );
};

export default ServicesPage;
