import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Star,
    Search,
    ThumbsUp,
    ThumbsDown,
    Filter,
    Info,
    Loader2,
} from "lucide-react";
import Layout from "@/components/Layout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { format, isValid, parseISO } from "date-fns";
import { pl, enUS } from "date-fns/locale";

interface Review {
    id: number;
    rating: number;
    comment: string;
    date: string;
    author: string;
    service: string;
    barber: string;
    helpful: number;
    unhelpful: number;
}

type SortOption   = "newest" | "highest" | "lowest";
type FilterOption = "all" | "5" | "4" | "3" | "2" | "1";

const defaultAvatar = "https://avatar.iran.liara.run/public/boy?username=";

const ReviewsPage = () => {
    const { t, lang } = useLanguage();
    const [allReviews, setAllReviews]       = useState<Review[]>([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [searchTerm, setSearchTerm]       = useState("");
    const [sort, setSort]                   = useState<SortOption>("newest");
    const [filter, setFilter]               = useState<FilterOption>("all");
    const [helpfulClicks, setHelpfulClicks]     = useState<Record<number, boolean>>({});
    const [unhelpfulClicks, setUnhelpfulClicks] = useState<Record<number, boolean>>({});

    const dateLocale = lang === "pl" ? pl : enUS;

    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/public/team/reviews`
                );
                if (!res.ok) throw new Error("Failed to fetch reviews");
                setAllReviews(await res.json());
            } catch {
                toast.error(t("reviews.loading"));
                setAllReviews([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const filteredAndSorted = allReviews
        .filter(r => {
            if (filter !== "all" && r.rating !== parseInt(filter)) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    r.comment.toLowerCase().includes(term) ||
                    r.author.toLowerCase().includes(term)  ||
                    r.service.toLowerCase().includes(term) ||
                    r.barber.toLowerCase().includes(term)
                );
            }
            return true;
        })
        .sort((a, b) => {
            if (sort === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
            if (sort === "highest") return b.rating - a.rating;
            return a.rating - b.rating;
        });

    const averageRating = useMemo(() => {
        if (!allReviews.length) return 0;
        return allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    }, [allReviews]);

    const ratingCounts = useMemo(
        () =>
            allReviews.reduce((acc, r) => {
                acc[r.rating] = (acc[r.rating] || 0) + 1;
                return acc;
            }, {} as Record<number, number>),
        [allReviews]
    );

    const renderStars = (rating: number, size = "h-5 w-5") =>
        Array(5).fill(0).map((_, i) => (
            <Star
                key={i}
                className={`${size} ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
            />
        ));

    const starLabel = (s: number) => {
        if (lang === "pl") {
            if (s === 1) return t("reviews.starSingular");
            if (s <= 4)  return t("reviews.starFew");
            return t("reviews.starMany");
        }
        return s === 1 ? t("reviews.starSingular") : t("reviews.starMany");
    };

    const formatDate = (dateStr: string) => {
        const parsed = parseISO(dateStr);
        return isValid(parsed) ? format(parsed, "PPP", { locale: dateLocale }) : t("reviews.invalidDate");
    };

    return (
        <Layout>
            {/* ── Hero ── */}
            <section className="relative py-24 md:py-36">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.72)), url('https://images.unsplash.com/photo-1621607510109-81551648f427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80')",
                    }}
                />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
                        {t("reviews.title")}
                    </h1>
                    <p
                        className="text-xl text-gray-300 max-w-3xl mx-auto mb-4 animate-fade-in"
                        style={{ animationDelay: "0.2s" }}
                    >
                        {t("reviews.subtitle")}
                    </p>
                    {!isLoading && allReviews.length > 0 && (
                        <div
                            className="flex items-center justify-center gap-2 animate-fade-in"
                            style={{ animationDelay: "0.3s" }}
                        >
                            <div className="flex">{renderStars(Math.round(averageRating))}</div>
                            <span className="text-white font-semibold text-xl">
                                {averageRating.toFixed(1)}
                            </span>
                            <span className="text-white/60">·</span>
                            <span className="text-white/80">
                                {allReviews.length} {t("reviews.reviewCount")}
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Content ── */}
            <section className="py-16 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* Rating summary */}
                        {!isLoading && allReviews.length > 0 && (
                            <div className="bg-card border border-border p-6 rounded-xl mb-10 animate-fade-in">
                                <h2 className="text-2xl font-semibold mb-6 text-foreground">
                                    {t("reviews.ratingSummary")}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="text-6xl font-bold text-barber">
                                            {averageRating.toFixed(1)}
                                        </div>
                                        <div className="flex mt-3">
                                            {renderStars(Math.round(averageRating))}
                                        </div>
                                        <div className="text-muted-foreground mt-2 text-sm">
                                            {allReviews.length} {t("reviews.totalReviews")}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = ratingCounts[star] || 0;
                                            const pct = allReviews.length ? (count / allReviews.length) * 100 : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-3">
                                                    <div className="w-20 text-sm flex items-center text-muted-foreground">
                                                        {star}
                                                        <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                                                    </div>
                                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-barber rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-10 text-right text-sm text-muted-foreground">
                                                        {count}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        type="text"
                                        placeholder={t("reviews.searchPlaceholder")}
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Select value={filter} onValueChange={v => setFilter(v as FilterOption)}>
                                        <SelectTrigger className="w-full md:w-44">
                                            <div className="flex items-center">
                                                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <SelectValue placeholder={t("reviews.filterAll")} />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("reviews.filterAll")}</SelectItem>
                                            {[5, 4, 3, 2, 1].map(s => (
                                                <SelectItem key={s} value={s.toString()}>
                                                    {s} {starLabel(s)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={sort} onValueChange={v => setSort(v as SortOption)}>
                                        <SelectTrigger className="w-full md:w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">{t("reviews.sortNewest")}</SelectItem>
                                            <SelectItem value="highest">{t("reviews.sortHighest")}</SelectItem>
                                            <SelectItem value="lowest">{t("reviews.sortLowest")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Reviews list */}
                        {isLoading ? (
                            <div className="text-center py-16">
                                <Loader2 className="h-12 w-12 text-barber animate-spin mx-auto" />
                                <p className="mt-4 text-muted-foreground">{t("reviews.loading")}</p>
                            </div>
                        ) : filteredAndSorted.length > 0 ? (
                            <div className="space-y-6">
                                {filteredAndSorted.map((review, i) => (
                                    <div
                                        key={review.id}
                                        className="bg-card border border-border rounded-xl p-6 animate-fade-in"
                                        style={{ animationDelay: `${0.04 * i}s` }}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={defaultAvatar + review.author.replace(/\s+/g, "")}
                                                    alt={review.author}
                                                    className="w-11 h-11 rounded-full object-cover bg-muted flex-shrink-0"
                                                />
                                                <div>
                                                    <h3 className="font-semibold text-foreground">
                                                        {review.author}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="flex">
                                                            {renderStars(review.rating, "h-4 w-4")}
                                                        </div>
                                                        <span className="text-muted-foreground text-xs">
                                                            {formatDate(review.date)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                                                <div>{review.service}</div>
                                                <div>{t("reviews.barberLabel")}: {review.barber}</div>
                                            </div>
                                        </div>
                                        <p className="my-4 text-foreground/90 leading-relaxed">
                                            {review.comment}
                                        </p>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-barber flex items-center gap-1.5"
                                                onClick={() =>
                                                    !helpfulClicks[review.id] &&
                                                    setHelpfulClicks(p => ({ ...p, [review.id]: true }))
                                                }
                                                disabled={!!helpfulClicks[review.id]}
                                            >
                                                <ThumbsUp
                                                    className={`h-4 w-4 ${helpfulClicks[review.id] ? "text-barber" : ""}`}
                                                />
                                                {t("reviews.helpful")} ({review.helpful + (helpfulClicks[review.id] ? 1 : 0)})
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-destructive flex items-center gap-1.5"
                                                onClick={() =>
                                                    !unhelpfulClicks[review.id] &&
                                                    setUnhelpfulClicks(p => ({ ...p, [review.id]: true }))
                                                }
                                                disabled={!!unhelpfulClicks[review.id]}
                                            >
                                                <ThumbsDown
                                                    className={`h-4 w-4 ${unhelpfulClicks[review.id] ? "text-destructive" : ""}`}
                                                />
                                                {t("reviews.unhelpful")} ({review.unhelpful + (unhelpfulClicks[review.id] ? 1 : 0)})
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Info className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-foreground text-lg font-medium">
                                    {t("reviews.noReviews")}
                                </p>
                                {searchTerm || filter !== "all" ? (
                                    <Button
                                        variant="outline"
                                        className="mt-4 border-barber text-barber hover:bg-barber hover:text-white"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setFilter("all");
                                            setSort("newest");
                                        }}
                                    >
                                        {t("reviews.clearFilters")}
                                    </Button>
                                ) : (
                                    <p className="text-muted-foreground text-sm mt-2">
                                        {t("reviews.beFirst")}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default ReviewsPage;
