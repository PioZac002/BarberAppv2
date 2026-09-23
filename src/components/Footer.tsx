import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lockup } from "@/components/brand/Szlif";

/**
 * The back of the label: what the shop is, what it does, where to find it,
 * and the small print. The page opens and closes on the same glaze.
 */
const Footer = () => {
    const { t } = useLanguage();

    const columns = [
        {
            head: t("footer.quickLinks"),
            links: [
                { name: t("nav.home"), to: "/" },
                { name: t("nav.services"), to: "/services" },
                { name: t("footer.team"), to: "/team" },
                { name: t("nav.reviews"), to: "/reviews" },
                { name: t("nav.bookAppointment"), to: "/booking" },
            ],
        },
        {
            head: t("footer.servicesTitle"),
            links: [
                { name: t("footer.haircut"), to: "/services" },
                { name: t("footer.beardTrim"), to: "/services" },
                { name: t("footer.hotTowelShave"), to: "/services" },
                { name: t("footer.hairColoring"), to: "/services" },
                { name: t("footer.kidsHaircut"), to: "/services" },
            ],
        },
    ];

    const social = [
        { Icon: Facebook, label: "Facebook" },
        { Icon: Instagram, label: "Instagram" },
        { Icon: Youtube, label: "YouTube" },
    ];

    return (
        <footer className="bg-sidebar text-sidebar-foreground">
            <div className="shelf" aria-hidden />
            <div className="mx-auto w-full max-w-[1440px] px-5 py-14 md:px-8 md:py-16">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
                    <div className="lg:pr-6">
                        <Lockup className="w-48" />
                        <p className="mt-5 max-w-xs text-sm leading-relaxed text-sidebar-foreground/75">
                            {t("footer.tagline")}
                        </p>
                        <div className="mt-6 flex gap-2">
                            {social.map(({ Icon, label }) => (
                                <a
                                    key={label}
                                    href="#"
                                    aria-label={label}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-[2px] border border-sidebar-border/80 text-sidebar-foreground/85 transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {columns.map(col => (
                        <nav key={col.head}>
                            <h3 className="directions border-b border-sidebar-border/70 pb-2 text-sidebar-foreground/70">
                                {col.head}
                            </h3>
                            <ul className="mt-4 space-y-2.5">
                                {col.links.map(link => (
                                    <li key={link.name}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-sidebar-foreground/85 underline-offset-4 transition-colors duration-200 hover:text-sidebar-foreground hover:underline"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}

                    <div>
                        <h3 className="directions border-b border-sidebar-border/70 pb-2 text-sidebar-foreground/70">
                            {t("footer.contact")}
                        </h3>
                        <ul className="mt-4 space-y-3.5 text-sm">
                            <li className="flex items-start gap-2.5">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                                <span className="text-sidebar-foreground/85">
                                    Kaliskiego 73, Bydgoszcz, 89-031
                                </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Phone className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                                <a href="tel:+48123456789" className="net-line text-sidebar-foreground/85 underline-offset-4 hover:underline">
                                    (123) 456-7890
                                </a>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Mail className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                                <a href="mailto:kontakt@szlif.pl" className="text-sidebar-foreground/85 underline-offset-4 hover:underline">
                                    kontakt@szlif.pl
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-sidebar-border/70 pt-6 md:flex-row md:items-center md:justify-between">
                    <p className="directions text-sidebar-foreground/65">
                        © {new Date().getFullYear()} Szlif. {t("footer.allRightsReserved")}
                        <span className="ml-3 border-l border-sidebar-border/70 pl-3">
                            {t("plate.demoShort")}
                        </span>
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <Link to="/privacy" className="directions text-sidebar-foreground/65 hover:text-sidebar-foreground">
                            {t("footer.privacyPolicy")}
                        </Link>
                        <Link to="/terms" className="directions text-sidebar-foreground/65 hover:text-sidebar-foreground">
                            {t("footer.terms")}
                        </Link>
                        <Link to="/contact" className="directions text-sidebar-foreground/65 hover:text-sidebar-foreground">
                            {t("footer.contactUs")}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
