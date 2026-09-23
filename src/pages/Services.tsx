import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { JarLoader, EmptyShelf } from "@/components/szlif/Loading";
import { toast } from "sonner";
import { catalogName, catalogDescription } from "@/lib/catalog-names";

interface Service {
    id: number;
    name: string;
    description: string;
    duration: number;
    price: number;
    image: string | null;
    category?: string;
}

/**
 * The tariff sheet. A barbershop's price list is a printed object with its
 * own conventions — position, name, directions, net time, price — so the
 * page is that object rather than a grid of icon cards.
 */
const ServicesPage = () => {
    const { t, lang } = useLanguage();
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
                const data: Service[] = await response.json();
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
            <section className="tile-wall">
                <div className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-16 md:px-8 md:pb-16 md:pt-20">
                    <h1 className="lockup text-wall text-[clamp(2.75rem,10vw,7rem)]">
                        {t("services.title")}
                    </h1>
                    <p className="mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-wall/85">
                        {t("services.subtitle")}
                    </p>
                </div>
                <div className="shelf" aria-hidden />
            </section>

            <section className="bg-background py-12 md:py-16">
                <div className="container">
                    {isLoading ? (
                        <JarLoader label={t("services.loading")} />
                    ) : services.length > 0 ? (
                        <div className="plate plate--flat overflow-hidden">
                            {/* the sheet's column heads */}
                            <div className="rule-double hidden grid-cols-[3.5rem_minmax(0,1fr)_7rem_8rem_3rem] items-end gap-4 px-5 pb-2 pt-5 md:grid">
                                <span className="directions">{t("plate.shelf")}</span>
                                <span className="directions">{t("plate.item")}</span>
                                <span className="directions text-right">{t("plate.duration")}</span>
                                <span className="directions text-right">{t("plate.price")}</span>
                                <span className="sr-only">{t("services.bookAppointment")}</span>
                            </div>

                            <ol>
                                {services.map((service, index) => (
                                    <li key={service.id} className="border-b border-border last:border-b-0">
                                        <Link
                                            to={`/booking?serviceId=${service.id}`}
                                            className="group grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3 px-5 py-6 transition-colors duration-200 hover:bg-accent/60 md:grid-cols-[3.5rem_minmax(0,1fr)_7rem_8rem_3rem] md:items-center md:gap-4"
                                        >
                                            <span className="net-line pt-1 text-sm text-muted-foreground md:pt-0">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>

                                            <div className="min-w-0">
                                                <h2 className="label-caps text-lg leading-tight">{catalogName(service.name, lang)}</h2>
                                                {service.description && (
                                                    <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
                                                        {catalogDescription(service.description, lang)}
                                                    </p>
                                                )}
                                            </div>

                                            <span className="col-start-2 flex items-baseline gap-4 md:contents">
                                                <span className="net-line order-2 text-sm text-muted-foreground md:order-none md:col-start-3 md:text-right">
                                                    {service.duration} {t("services.duration")}
                                                </span>
                                                <span className="net-line order-1 text-xl font-semibold md:order-none md:col-start-4 md:text-right">
                                                    {service.price.toFixed(2)}
                                                    <span className="ml-1 text-micro text-muted-foreground">PLN</span>
                                                </span>
                                            </span>

                                            <span className="col-start-2 flex items-center gap-2 md:col-start-5 md:justify-end">
                                                <span className="label-caps text-[0.6875rem] text-primary md:sr-only">
                                                    {t("services.bookAppointment")}
                                                </span>
                                                <ArrowRight className="h-4 w-4 text-primary transition-transform duration-300 group-hover:translate-x-1" />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ) : (
                        <EmptyShelf
                            title={t("services.noServices")}
                            hint={t("services.noServicesHint")}
                        />
                    )}
                </div>
            </section>
        </Layout>
    );
};

export default ServicesPage;
