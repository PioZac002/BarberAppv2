import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Star,
    Search,
    ThumbsUp,
    ThumbsDown,
    Filter,
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
import { useDateLocale } from "@/hooks/useDateLocale";
import { toast } from "sonner";
import { format, isValid, parseISO } from "date-fns";
import { JarLoader } from "@/components/szlif/Loading";
import { Initials, Provenance, DemoNotice } from "@/components/szlif/Bits";
import { catalogName } from "@/lib/catalog-names";

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


const ReviewsPage = () => {
    const { t, lang } = useLanguage();
    const [allReviews, setAllReviews]       = useState<Review[]>([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [searchTerm, setSearchTerm]       = useState("");
    const [sort, setSort]                   = useState<SortOption>("newest");
    const [filter, setFilter]               = useState<FilterOption>("all");
    const [helpfulClicks, setHelpfulClicks]     = useState<Record<number, boolean>>({});
    const [unhelpfulClicks, setUnhelpfulClicks] = useState<Record<number, boolean>>({});
    const dateLocale = useDateLocale();

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
                className={`${size} ${i < rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
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
            <section className="tile-wall">
                <div className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-16 md:px-8 md:pb-16 md:pt-20">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <h1 className="lockup text-wall text-[clamp(2.75rem,10vw,7rem)]">
                                {t("reviews.title")}
                            </h1>
                            <p className="mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-wall/85">
                                {t("reviews.subtitle")}
                            </p>
                        </div>

                        {!isLoading && allReviews.length > 0 && (
                            <div className="shrink-0 lg:border-l lg:border-wall/30 lg:pl-8">
                                <p className="net-line text-[clamp(3rem,9vw,5rem)] font-semibold leading-none text-wall">
                                    {averageRating.toFixed(1)}
                                </p>
                                <div className="mt-3 flex items-center gap-1">
                                    {renderStars(Math.round(averageRating))}
                                </div>
                                <p className="directions mt-2.5 text-wall/70">
                                    {allReviews.length} {t("reviews.reviewCount")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="shelf" aria-hidden />
            </section>

            {/* ── Content ── */}
            <section className="py-16 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <DemoNotice className="mb-6" />

                        {/* Rating summary */}
                        {!isLoading && allReviews.length > 0 && (
                            <div className="plate mb-10 p-6">
                                <h2 className="section-head rule-double mb-6 pb-3 text-xl">
                                    {t("reviews.ratingSummary")}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="net-line text-6xl font-semibold text-primary">
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
                                                    <div className="net-line flex w-20 items-center text-sm text-muted-foreground">
                                                        {star}
                                                        <Star className="h-3 w-3 ml-1 text-primary fill-primary" />
                                                    </div>
                                                    <div className="relative h-2 flex-1 overflow-hidden rounded-[1px] border border-foreground/25 bg-secondary">
                                                        <div
                                                            className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-700 ease-out-liquid after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-tile/90"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <div className="net-line w-10 text-right text-sm text-muted-foreground">
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
                        <div className="mb-8">
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
                            <JarLoader label={t("reviews.loading")} />
                        ) : filteredAndSorted.length > 0 ? (
                            <div className="space-y-6">
                                {filteredAndSorted.map((review, i) => (
                                    <div key={review.id} className="plate p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <Initials name={review.author} className="h-11 w-11" />
                                                <div>
                                                    <h3 className="label-caps text-[0.9375rem]">
                                                        {review.author}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="flex">
                                                            {renderStars(review.rating, "h-4 w-4")}
                                                        </div>
                                                        <span className="net-line text-micro text-muted-foreground">
                                                            {formatDate(review.date)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <div className="directions">{catalogName(review.service, lang)}</div>
                                                <div className="directions mt-0.5">
                                                    {t("reviews.barberLabel")}: {review.barber}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="my-5 max-w-prose leading-relaxed text-foreground/90">
                                            {review.comment}
                                        </p>
                                        <Provenance
                                            who={review.author}
                                            when={formatDate(review.date)}
                                            rev={review.id}
                                        />

                                        <div className="mt-3 flex gap-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-primary flex items-center gap-1.5"
                                                onClick={() =>
                                                    !helpfulClicks[review.id] &&
                                                    setHelpfulClicks(p => ({ ...p, [review.id]: true }))
                                                }
                                                disabled={!!helpfulClicks[review.id]}
                                            >
                                                <ThumbsUp
                                                    className={`h-4 w-4 ${helpfulClicks[review.id] ? "text-primary" : ""}`}
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
                            <div className="plate px-6 py-14 text-center">
                                <p className="label-caps text-base">{t("reviews.noReviews")}</p>
                                {searchTerm || filter !== "all" ? (
                                    <Button
                                        variant="outline"
                                        className="mt-5"
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
