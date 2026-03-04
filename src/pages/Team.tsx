import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Mail,
    Phone,
    Star,
    Calendar as CalendarIcon,
    Award,
    CheckCircle,
    User as UserIcon,
    Camera,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface BarberSummary {
    id: number;
    name: string;
    role: string;
    rating: number;
    experience: number;
    specializations: string[];
    image: string | null;
}

interface BarberDetails extends BarberSummary {
    email: string;
    phone: string;
    bio: string;
    certifications: string[];
    portfolioImages: (string | null)[];
}

const Team = () => {
    const { t } = useLanguage();
    const [teamMembers, setTeamMembers]       = useState<BarberSummary[]>([]);
    const [isLoading, setIsLoading]           = useState(true);
    const [searchTerm, setSearchTerm]         = useState("");
    const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
    const [selectedMember, setSelectedMember] = useState<BarberSummary | null>(null);
    const [detailedProfile, setDetailedProfile] = useState<BarberDetails | null>(null);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
    const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchTeam = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/public/team/barbers`
                );
                if (!res.ok) throw new Error("Failed to fetch team");
                setTeamMembers(await res.json());
            } catch {
                toast.error(t("team.loading"));
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeam();
    }, []);

    useEffect(() => {
        if (!selectedMember?.id) return;
        const fetchDetails = async () => {
            setIsModalLoading(true);
            setDetailedProfile(null);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/public/team/barbers/${selectedMember.id}/details`
                );
                if (!res.ok) throw new Error("Failed to fetch details");
                setDetailedProfile(await res.json());
            } catch {
                toast.error(`${t("team.loading")} (${selectedMember.name})`);
            } finally {
                setIsModalLoading(false);
            }
        };
        fetchDetails();
    }, [selectedMember]);

    const normalizeSpec  = (s: string) => s?.trim().toLowerCase() || "";
    const capitalizeSpec = (s: string) => {
        const trimmed = s.trim();
        return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : trimmed;
    };

    const specializationOptions = [
        { id: "all", name: t("team.allSpecializations") },
        ...(() => {
            const map = new Map<string, string>();
            teamMembers.forEach(m =>
                (m.specializations || []).forEach(raw => {
                    const key = normalizeSpec(raw);
                    if (key && !map.has(key)) map.set(key, capitalizeSpec(key));
                })
            );
            return Array.from(map.entries()).map(([k, v]) => ({ id: k, name: v }));
        })(),
    ];

    const filteredMembers = teamMembers.filter(m => {
        const term = searchTerm.toLowerCase();
        const matches = m.name.toLowerCase().includes(term) || m.role.toLowerCase().includes(term);
        const specMatch =
            selectedSpecialization === "all" ||
            (m.specializations || []).some(s => normalizeSpec(s) === normalizeSpec(selectedSpecialization));
        return matches && specMatch;
    });

    const renderStars = (rating: number) => {
        const full = Math.floor(rating);
        const almostFull = rating % 1 >= 0.75;
        return (
            <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${
                            i < full || (i === full && almostFull)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground/30"
                        }`}
                    />
                ))}
            </div>
        );
    };

    const openPortfolio = (images: (string | null)[], index: number) => {
        const filtered = images.filter((img): img is string => !!img);
        if (!filtered.length) return;
        setPortfolioImages(filtered);
        setCurrentImageIndex(index < filtered.length ? index : 0);
        setIsPortfolioOpen(true);
    };

    return (
        <Layout>
            {/* ── Hero ── */}
            <section className="relative py-24 md:py-36">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), url('https://images.unsplash.com/photo-1599491143868-40d9afbd6c0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80')",
                    }}
                />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
                        {t("team.heroTitle")}
                    </h1>
                    <p
                        className="text-xl text-gray-300 max-w-3xl mx-auto animate-fade-in"
                        style={{ animationDelay: "0.2s" }}
                    >
                        {t("team.heroSubtitle")}
                    </p>
                </div>
            </section>

            {/* ── Team grid ── */}
            <section className="py-16 bg-background">
                <div className="container mx-auto px-4">
                    {/* Filters */}
                    <div className="mb-10 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <input
                                type="text"
                                placeholder={t("team.searchPlaceholder")}
                                className="pl-10 pr-4 py-2.5 w-full border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-barber focus:border-transparent transition-colors"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                            {specializationOptions.map(spec => (
                                <Button
                                    key={spec.id}
                                    onClick={() => setSelectedSpecialization(spec.id)}
                                    variant={selectedSpecialization === spec.id ? "default" : "outline"}
                                    className={
                                        selectedSpecialization === spec.id
                                            ? "bg-barber hover:bg-barber-muted text-white"
                                            : "border-border text-foreground hover:bg-muted"
                                    }
                                    size="sm"
                                >
                                    {spec.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber mx-auto" />
                            <p className="mt-4 text-muted-foreground">{t("team.loading")}</p>
                        </div>
                    ) : filteredMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredMembers.map((member, i) => (
                                <div
                                    key={member.id}
                                    className="bg-card rounded-xl overflow-hidden border border-border hover:border-barber/40 hover:shadow-xl transition-all duration-300 cursor-pointer group animate-fade-in"
                                    style={{ animationDelay: `${0.06 * i}s` }}
                                    onClick={() => setSelectedMember(member)}
                                >
                                    <div className="h-64 overflow-hidden bg-muted flex items-center justify-center">
                                        {member.image ? (
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <UserIcon className="h-24 w-24 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-xl font-semibold mb-1 text-foreground group-hover:text-barber transition-colors">
                                            {member.name}
                                        </h3>
                                        <p className="text-barber text-sm mb-3">{member.role}</p>
                                        <div className="flex items-center gap-3 mb-3 text-sm">
                                            {renderStars(member.rating)}
                                            <span className="text-muted-foreground">
                                                ({member.rating.toFixed(1)})
                                            </span>
                                            <span className="text-muted-foreground">
                                                {member.experience} {t("team.experience")}
                                            </span>
                                        </div>
                                        {(member.specializations?.length ?? 0) > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {member.specializations.slice(0, 3).map(spec => (
                                                    <Badge
                                                        key={normalizeSpec(spec)}
                                                        variant="secondary"
                                                        className="px-2.5 py-0.5 text-xs"
                                                    >
                                                        {capitalizeSpec(spec)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="w-full border-barber text-barber hover:bg-barber hover:text-white transition-colors"
                                            onClick={e => {
                                                e.stopPropagation();
                                                setSelectedMember(member);
                                            }}
                                        >
                                            {t("team.viewProfile")}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <UserIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-foreground text-lg font-medium">{t("team.noMembers")}</p>
                            <p className="text-muted-foreground mt-1">{t("team.noMembersHint")}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Barber profile modal ── */}
            <Dialog
                open={!!selectedMember}
                onOpenChange={open => !open && setSelectedMember(null)}
            >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                    {detailedProfile && (
                        <DialogHeader className="sr-only">
                            <DialogTitle>{detailedProfile.name}</DialogTitle>
                            <DialogDescription>
                                {detailedProfile.role} – {detailedProfile.name}
                            </DialogDescription>
                        </DialogHeader>
                    )}

                    {isModalLoading && !detailedProfile ? (
                        <div className="h-96 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-barber" />
                        </div>
                    ) : detailedProfile ? (
                        <>
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row items-start gap-5 mb-6">
                                    <div className="flex-shrink-0">
                                        {detailedProfile.image ? (
                                            <img
                                                src={detailedProfile.image}
                                                alt={detailedProfile.name}
                                                className="w-24 h-24 rounded-full object-cover border-4 border-barber shadow-md"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-barber shadow-md">
                                                <UserIcon className="w-12 h-12 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 sm:mt-0">
                                        <h2 className="text-3xl font-bold text-foreground">
                                            {detailedProfile.name}
                                        </h2>
                                        <p className="text-muted-foreground mt-1">
                                            {detailedProfile.role} · {detailedProfile.experience} {t("team.experience")}
                                        </p>
                                        <div className="flex mt-2">
                                            {renderStars(detailedProfile.rating)}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                                    <div className="md:col-span-3 space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-foreground">
                                                {t("team.about")} {detailedProfile.name.split(" ")[0]}
                                            </h3>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {detailedProfile.bio || t("team.noDescription")}
                                            </p>
                                        </div>
                                        {(detailedProfile.specializations?.length ?? 0) > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3 text-foreground">
                                                    {t("team.specializations")}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {detailedProfile.specializations.map(spec => (
                                                        <Badge
                                                            key={normalizeSpec(spec)}
                                                            variant="secondary"
                                                            className="bg-barber/10 text-barber dark:bg-barber/20 text-sm"
                                                        >
                                                            {capitalizeSpec(spec)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 space-y-6">
                                        {(detailedProfile.certifications?.length ?? 0) > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center">
                                                    <Award className="h-5 w-5 mr-2 text-barber" />
                                                    {t("team.certifications")}
                                                </h3>
                                                <ul className="space-y-1.5 text-sm text-muted-foreground">
                                                    {detailedProfile.certifications.map((cert, i) => (
                                                        <li key={i} className="flex items-center">
                                                            <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                                                            {cert}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 text-foreground">
                                                {t("team.contact")}
                                            </h3>
                                            {detailedProfile.email && (
                                                <p className="flex items-center mb-2 text-sm">
                                                    <Mail className="h-4 w-4 mr-2 text-barber flex-shrink-0" />
                                                    <a
                                                        href={`mailto:${detailedProfile.email}`}
                                                        className="text-barber hover:underline truncate"
                                                    >
                                                        {detailedProfile.email}
                                                    </a>
                                                </p>
                                            )}
                                            {detailedProfile.phone && (
                                                <p className="flex items-center text-sm">
                                                    <Phone className="h-4 w-4 mr-2 text-barber flex-shrink-0" />
                                                    <a
                                                        href={`tel:${detailedProfile.phone}`}
                                                        className="text-barber hover:underline"
                                                    >
                                                        {detailedProfile.phone}
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(detailedProfile.portfolioImages?.length ?? 0) > 0 && (
                                <div className="bg-muted/50 px-6 py-5 border-t border-border">
                                    <h3 className="text-lg font-semibold mb-4 text-foreground">
                                        {t("team.portfolioTitle")}
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {detailedProfile.portfolioImages.slice(0, 8).map((img, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-barber"
                                                onClick={() => openPortfolio(detailedProfile.portfolioImages, i)}
                                            >
                                                {img ? (
                                                    <img
                                                        src={img}
                                                        alt={`Portfolio ${i + 1}`}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <Camera className="w-8 h-8 text-muted-foreground/50" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
                                <Button
                                    asChild
                                    className="w-full bg-barber hover:bg-barber-muted text-white text-lg py-6 btn-hover"
                                >
                                    <Link to={`/booking?barberId=${detailedProfile.id}`}>
                                        <CalendarIcon className="h-5 w-5 mr-2" />
                                        {t("team.bookWithPerson")} {detailedProfile.name.split(" ")[0]}
                                    </Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="h-96 flex items-center justify-center p-6">
                            <p className="text-muted-foreground text-center">{t("team.notFound")}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Portfolio viewer modal ── */}
            <Dialog open={isPortfolioOpen} onOpenChange={setIsPortfolioOpen}>
                <DialogContent className="max-w-3xl">
                    {portfolioImages.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <div className="relative w-full max-h-[70vh] flex items-center justify-center bg-black/80 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentImageIndex(p =>
                                            p === 0 ? portfolioImages.length - 1 : p - 1
                                        )
                                    }
                                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-barber text-white rounded-full p-2 transition-colors"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <img
                                    src={portfolioImages[currentImageIndex]}
                                    alt={`Portfolio ${currentImageIndex + 1}`}
                                    className="max-h-[70vh] w-auto object-contain"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentImageIndex(p =>
                                            p === portfolioImages.length - 1 ? 0 : p + 1
                                        )
                                    }
                                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-barber text-white rounded-full p-2 transition-colors"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="mt-3 text-sm text-muted-foreground">
                                {t("team.photoOf")} {currentImageIndex + 1} {t("team.of")} {portfolioImages.length}
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-muted-foreground">
                            {t("team.noPhotos")}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

export default Team;
