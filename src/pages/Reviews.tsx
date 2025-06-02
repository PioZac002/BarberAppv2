// src/pages/Reviews.tsx
import { useState, useEffect,useMemo } from "react"; // Dodano useEffect
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Star, Calendar as CalendarIcon, Search, ThumbsUp, ThumbsDown, Filter, Info, Loader2 } from "lucide-react"; // Dodano Info, Loader2
import Layout from "@/components/Layout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Dodano import toast
import { format, isValid, parseISO } from "date-fns"; // Dodano parseISO

// Zaktualizowany interfejs Review
interface Review {
    id: number;
    rating: number;
    comment: string;
    date: string; // Będzie stringiem ISO z backendu
    author: string;
    // authorImage?: string; // Na razie pomijamy, można dodać placeholder lub pobierać z User
    service: string;
    barber: string;
    helpful: number; // Na razie jako placeholder
    unhelpful: number; // Na razie jako placeholder
}

type SortOption = "newest" | "highest" | "lowest";
type FilterOption = "all" | "5" | "4" | "3" | "2" | "1";

// Placeholder dla avatara, jeśli nie mamy `authorImage`
const defaultAvatar = "https://avatar.iran.liara.run/public/boy?username=";


const ReviewsPage = () => { // Zmieniono nazwę komponentu na ReviewsPage dla jasności
    const [allReviews, setAllReviews] = useState<Review[]>([]); // Przechowuje wszystkie pobrane recenzje
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sort, setSort] = useState<SortOption>("newest");
    const [filter, setFilter] = useState<FilterOption>("all");
    // Logikę helpful/unhelpful na razie zostawiamy po stronie klienta jako demonstrację
    const [helpfulClicks, setHelpfulClicks] = useState<{[key: number]: boolean}>({});
    const [unhelpfulClicks, setUnhelpfulClicks] = useState<{[key: number]: boolean}>({});

    useEffect(() => {
        const fetchReviews = async () => {
            setIsLoading(true);
            try {
                // Używamy endpointu z publicTeamRoutes
                const response = await fetch("http://localhost:3000/api/public/team/reviews");
                if (!response.ok) {
                    throw new Error("Failed to fetch reviews from API");
                }
                const data: Review[] = await response.json();
                setAllReviews(data);
            } catch (error) {
                console.error("Error fetching reviews:", error);
                toast.error("Could not load reviews. Please try again later.");
                setAllReviews([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);


    const filteredAndSortedReviews = allReviews
        .filter((review) => {
            if (filter !== "all" && review.rating !== parseInt(filter)) {
                return false;
            }
            if (searchTerm &&
                !review.comment.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !review.author.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !review.service.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !review.barber.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            if (sort === "newest") {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            } else if (sort === "highest") {
                return b.rating - a.rating;
            } else if (sort === "lowest") {
                return a.rating - b.rating;
            }
            return 0;
        });

    const handleHelpfulClick = (id: number) => {
        if (!helpfulClicks[id]) {
            setHelpfulClicks({...helpfulClicks, [id]: true});
            // Tutaj można by wysłać request do backendu, aby zaktualizować licznik 'helpful'
            // np. setAllReviews(prev => prev.map(r => r.id === id ? {...r, helpful: r.helpful + 1} : r));
        }
    };

    const handleUnhelpfulClick = (id: number) => {
        if (!unhelpfulClicks[id]) {
            setUnhelpfulClicks({...unhelpfulClicks, [id]: true});
            // Analogicznie dla 'unhelpful'
        }
    };

    const averageRating = useMemo(() => { // Obliczaj tylko gdy allReviews się zmienia
        if (allReviews.length === 0) return 0;
        return allReviews.reduce((acc, review) => acc + review.rating, 0) / allReviews.length;
    }, [allReviews]);

    const ratingCounts = useMemo(() => { // Obliczaj tylko gdy allReviews się zmienia
        return allReviews.reduce((acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
        }, {} as {[key: number]: number});
    }, [allReviews]);

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star key={i} className={`h-5 w-5 ${ i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300" }`} />
        ));
    };

    return (
        <Layout>
            <section className="relative py-24 md:py-32">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1621607510109-81551648f427?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80')",
                    }}
                ></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
                        Customer Reviews
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                        See what our clients have to say about their experiences.
                    </p>
                    { !isLoading && allReviews.length > 0 && (
                        <div className="flex items-center justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
                            <div className="flex items-center">
                                {renderStars(Math.round(averageRating))}
                                <span className="ml-2 text-white font-semibold text-xl">
                                    {averageRating.toFixed(1)}
                                </span>
                            </div>
                            <span className="mx-2 text-white">•</span>
                            <span className="text-white">{allReviews.length} reviews</span>
                        </div>
                    )}
                </div>
            </section>

            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        {!isLoading && allReviews.length > 0 && (
                            <div className="bg-gray-50 p-6 rounded-lg mb-10 animate-fade-in">
                                <h2 className="text-2xl font-semibold mb-6">Rating Overview</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex flex-col justify-center items-center">
                                        <div className="text-6xl font-bold text-barber-dark">{averageRating.toFixed(1)}</div>
                                        <div className="flex mt-2">{renderStars(Math.round(averageRating))}</div>
                                        <div className="text-gray-500 mt-2">{allReviews.length} total reviews</div>
                                    </div>
                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = ratingCounts[star] || 0;
                                            const percentage = allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
                                            return (
                                                <div key={star} className="flex items-center">
                                                    <div className="w-20 text-sm flex items-center">
                                                        {star} <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-barber rounded-full" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                    <div className="w-16 text-right text-sm text-gray-500">{count}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input type="text" placeholder="Search reviews..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    <Select value={filter} onValueChange={(value) => setFilter(value as FilterOption)}>
                                        <SelectTrigger className="w-full md:w-32"><div className="flex items-center"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter" /></div></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Stars</SelectItem>
                                            {[5, 4, 3, 2, 1].map(s => <SelectItem key={s} value={s.toString()}>{s} Star{s > 1 ? 's' : ''}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                                        <SelectTrigger className="w-full md:w-32"><SelectValue placeholder="Sort by" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest</SelectItem>
                                            <SelectItem value="highest">Highest Rating</SelectItem>
                                            <SelectItem value="lowest">Lowest Rating</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-10">
                                <Loader2 className="h-12 w-12 text-barber animate-spin mx-auto" />
                                <p className="mt-3 text-gray-600">Loading reviews...</p>
                            </div>
                        ) : filteredAndSortedReviews.length > 0 ? (
                            <div className="space-y-8">
                                {filteredAndSortedReviews.map((review, index) => (
                                    <div key={review.id} className="border-b pb-8 animate-fade-in" style={{ animationDelay: `${0.05 * index}s` }}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center">
                                                <img
                                                    src={defaultAvatar + review.author.replace(/\s+/g, '')} // Prosty placeholder
                                                    alt={review.author}
                                                    className="w-12 h-12 rounded-full object-cover mr-4 bg-gray-200"
                                                />
                                                <div>
                                                    <h3 className="font-semibold">{review.author}</h3>
                                                    <div className="flex items-center mt-1">
                                                        <div className="flex mr-2">{renderStars(review.rating)}</div>
                                                        <span className="text-gray-500 text-sm">
                                                            {isValid(parseISO(review.date)) ? format(parseISO(review.date), "MMMM d, yyyy") : "Invalid date"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-gray-500">
                                                <div>{review.service}</div>
                                                <div>by {review.barber}</div>
                                            </div>
                                        </div>
                                        <p className="my-4 text-gray-700">{review.comment}</p>
                                        {/* Funkcjonalność helpful/unhelpful na razie uproszczona, bez backendu */}
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex space-x-4">
                                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-barber flex items-center" onClick={() => handleHelpfulClick(review.id)} disabled={!!helpfulClicks[review.id]}>
                                                    <ThumbsUp className={`h-4 w-4 mr-1 ${helpfulClicks[review.id] ? 'text-barber' : ''}`} />
                                                    Helpful ({review.helpful + (helpfulClicks[review.id] ? 1 : 0)})
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-barber flex items-center" onClick={() => handleUnhelpfulClick(review.id)} disabled={!!unhelpfulClicks[review.id]}>
                                                    <ThumbsDown className={`h-4 w-4 mr-1 ${unhelpfulClicks[review.id] ? 'text-barber' : ''}`} />
                                                    Not Helpful ({review.unhelpful + (unhelpfulClicks[review.id] ? 1 : 0)})
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Info className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg text-gray-500">No reviews found matching your criteria.</p>
                                {searchTerm || filter !== "all" ? (
                                    <Button variant="outline" className="mt-4" onClick={() => { setSearchTerm(""); setFilter("all"); setSort("newest"); }}>
                                        Clear Filters
                                    </Button>
                                ) : (
                                    <p className="text-gray-400 text-sm mt-2">Be the first to review our services!</p>
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