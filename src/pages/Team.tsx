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
import { JarLoader, EmptyShelf } from "@/components/szlif/Loading";
import { Portrait, DemoNotice, Initials } from "@/components/szlif/Bits";
import { catalogName } from "@/lib/catalog-names";
import { mediaUrl } from "@/lib/media-url";
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
    const { t, lang } = useLanguage();
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
                if (!res.ok) throw new Error(t("errors.loadFailed"));
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
                if (!res.ok) throw new Error(t("errors.loadFailed"));
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
    // specialties are stored in English; the chip shows the reader's language
    const capitalizeSpec = (s: string) => {
        const named = catalogName(s, lang);
        const trimmed = (named || s).trim();
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
                                ? "text-primary fill-primary"
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
            <section className="tile-wall">
                <div className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-16 md:px-8 md:pb-16 md:pt-20">
                    <h1 className="lockup text-wall text-[clamp(2.75rem,10vw,7rem)]">
                        {t("team.heroTitle")}
                    </h1>
                    <p className="mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-wall/85">
                        {t("team.heroSubtitle")}
                    </p>
                </div>
                <div className="shelf" aria-hidden />
            </section>

            {/* ── Team grid ── */}
            <section className="py-16 bg-background">
                <div className="container mx-auto px-4">
                    <DemoNotice className="mb-8" />

                    {/* Filters */}
                    <div className="mb-10 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <input
                                type="text"
                                placeholder={t("team.searchPlaceholder")}
                                className="h-11 w-full rounded-[2px] border border-foreground/45 bg-background pl-10 pr-4 text-sm text-foreground transition-colors duration-200 placeholder:text-muted-foreground hover:border-foreground/70 focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-primary"
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
                                            ? ""
                                            : ""
                                    }
                                    size="sm"
                                >
                                    {spec.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <JarLoader label={t("team.loading")} />
                    ) : filteredMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredMembers.map((member, i) => (
                                <div
                                    key={member.id}
                                    className="plate plate-interactive group cursor-pointer overflow-hidden"
                                    onClick={() => setSelectedMember(member)}
                                >
                                    {/* the portrait is mounted inside the label's rule,
                                        the way a photograph is pasted onto a card */}
                                    <div className="p-1.5">
                                        <Portrait
                                            src={mediaUrl(member.image)}
                                            alt={member.name}
                                            className="h-60 w-full [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-[1.04]"
                                            fallback={
                                                <Initials
                                                    name={member.name}
                                                    className="h-24 w-24 border-2 text-3xl"
                                                />
                                            }
                                        />
                                    </div>
                                    <div className="px-4 pb-4 pt-3">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <h3 className="label-caps text-lg leading-tight">{member.name}</h3>
                                            <span className="directions shrink-0">
                                                {t("plate.station")} {String(i + 1).padStart(2, "0")}
                                            </span>
                                        </div>
                                        <p className="directions mt-1.5 text-primary">{member.role}</p>
                                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                                            <span className="flex items-center gap-1.5">
                                                {renderStars(member.rating)}
                                                <span className="net-line text-muted-foreground">
                                                    {member.rating.toFixed(1)}
                                                </span>
                                            </span>
                                            <span className="net-line text-muted-foreground">
                                                {member.experience} {t("team.experience")}
                                            </span>
                                        </div>
                                        {(member.specializations?.length ?? 0) > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-1.5">
                                                {member.specializations.slice(0, 3).map(spec => (
                                                    <Badge
                                                        key={normalizeSpec(spec)}
                                                        variant="outline"
                                                    >
                                                        {capitalizeSpec(spec)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="mt-5 w-full"
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
                        <EmptyShelf title={t("team.noMembers")} hint={t("team.noMembersHint")} />
                    )}
                </div>
            </section>

            {/* ── Barber profile modal ── */}
            <Dialog
                open={!!selectedMember}
                onOpenChange={open => !open && setSelectedMember(null)}
            >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                    {/* The dialog needs a name from the moment it opens, not
                        from the moment its data arrives, or a screen reader
                        announces an untitled dialog for the whole load. */}
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            {detailedProfile?.name ?? selectedMember?.name ?? t("team.title")}
                        </DialogTitle>
                        <DialogDescription>
                            {detailedProfile
                                ? `${detailedProfile.role} – ${detailedProfile.name}`
                                : t("common.loading")}
                        </DialogDescription>
                    </DialogHeader>

                    {isModalLoading && !detailedProfile ? (
                        <div className="h-96 flex items-center justify-center">
                            <JarLoader />
                        </div>
                    ) : detailedProfile ? (
                        <>
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row items-start gap-5 mb-6">
                                    <div className="flex-shrink-0">
                                        {detailedProfile.image ? (
                                            <img
                                                src={mediaUrl(detailedProfile.image)}
                                                alt={detailedProfile.name}
                                                className="h-24 w-24 rounded-[2px] border border-foreground/40 object-cover shadow-plate"
                                            />
                                        ) : (
                                            <div className="flex h-24 w-24 items-center justify-center rounded-[2px] border border-foreground/40 bg-secondary shadow-plate">
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
                                                            className="bg-primary/10 text-primary dark:bg-primary/20 text-sm"
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
                                                    <Award className="h-5 w-5 mr-2 text-primary" />
                                                    {t("team.certifications")}
                                                </h3>
                                                <ul className="space-y-1.5 text-sm text-muted-foreground">
                                                    {detailedProfile.certifications.map((cert, i) => (
                                                        <li key={i} className="flex items-center">
                                                            <CheckCircle className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
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
                                                    <Mail className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                                                    <a
                                                        href={`mailto:${detailedProfile.email}`}
                                                        className="text-primary hover:underline truncate"
                                                    >
                                                        {detailedProfile.email}
                                                    </a>
                                                </p>
                                            )}
                                            {detailedProfile.phone && (
                                                <p className="flex items-center text-sm">
                                                    <Phone className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                                                    <a
                                                        href={`tel:${detailedProfile.phone}`}
                                                        className="text-primary hover:underline"
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
                                                className="photo-frame aspect-square focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
                                    className="w-full"
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
                            <div className="relative w-full max-h-[70vh] flex items-center justify-center bg-ink/85 rounded-[2px] overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentImageIndex(p =>
                                            p === 0 ? portfolioImages.length - 1 : p - 1
                                        )
                                    }
                                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-ink/60 hover:bg-primary text-wall rounded-[2px] p-2 transition-colors"
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
                                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-ink/60 hover:bg-primary text-wall rounded-[2px] p-2 transition-colors"
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
