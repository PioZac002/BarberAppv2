
import { useState } from "react";
import {
    Star,
    Search,
    ThumbsUp,
    ThumbsDown,
    Filter
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

// Sample review data
interface Review {
    id: number;
    rating: number;
    comment: string;
    date: string;
    author: string;
    authorImage: string;
    service: string;
    barber: string;
    helpful: number;
    unhelpful: number;
}

const reviews: Review[] = [
    {
        id: 1,
        rating: 5,
        comment: "Absolutely fantastic service! David did an amazing job with my haircut. The attention to detail was exceptional, and the hot towel experience was so relaxing. I've finally found my go-to barber shop.",
        date: "2023-10-15",
        author: "John Smith",
        authorImage: "https://randomuser.me/api/portraits/men/32.jpg",
        service: "Classic Haircut",
        barber: "David Mitchell",
        helpful: 24,
        unhelpful: 2,
    },
    {
        id: 2,
        rating: 4,
        comment: "Great beard trim and styling by Michael. He really knows how to shape a beard to match face structure. The only reason for 4 stars instead of 5 is that I had to wait about 15 minutes past my appointment time.",
        date: "2023-10-10",
        author: "Robert Johnson",
        authorImage: "https://randomuser.me/api/portraits/men/44.jpg",
        service: "Beard Trim & Shape",
        barber: "Michael Rodriguez",
        helpful: 18,
        unhelpful: 3,
    },
    {
        id: 3,
        rating: 5,
        comment: "The hot towel shave was incredible! I've never had such a smooth, close shave. The entire experience was luxurious from start to finish. Michael is truly a master of his craft.",
        date: "2023-10-05",
        author: "Thomas Wilson",
        authorImage: "https://randomuser.me/api/portraits/men/67.jpg",
        service: "Hot Towel Shave",
        barber: "Michael Rodriguez",
        helpful: 32,
        unhelpful: 1,
    },
    {
        id: 4,
        rating: 5,
        comment: "Sarah did an incredible job with my hair color. She listened to exactly what I wanted and delivered perfect results. The atmosphere of the shop is also great - relaxing but professional.",
        date: "2023-09-28",
        author: "James Anderson",
        authorImage: "https://randomuser.me/api/portraits/men/22.jpg",
        service: "Hair Coloring",
        barber: "Sarah Johnson",
        helpful: 27,
        unhelpful: 0,
    },
    {
        id: 5,
        rating: 3,
        comment: "The haircut itself was good, but I found the price to be a bit high compared to other places in the area. Service was professional though and the shop is very clean and well-maintained.",
        date: "2023-09-20",
        author: "Michael Brown",
        authorImage: "https://randomuser.me/api/portraits/men/55.jpg",
        service: "Classic Haircut",
        barber: "James Wilson",
        helpful: 12,
        unhelpful: 8,
    },
    {
        id: 6,
        rating: 5,
        comment: "First time bringing my son for a kids haircut and it was a great experience. David was patient and made my son feel comfortable throughout the process. Will definitely be back!",
        date: "2023-09-15",
        author: "William Taylor",
        authorImage: "https://randomuser.me/api/portraits/men/36.jpg",
        service: "Kid's Haircut",
        barber: "David Mitchell",
        helpful: 19,
        unhelpful: 1,
    },
    {
        id: 7,
        rating: 4,
        comment: "Great experience overall. The haircut and beard trim combo was exactly what I wanted. Daniel is talented and took the time to understand my preferences. Only wish the wait time was shorter.",
        date: "2023-09-10",
        author: "Joseph Miller",
        authorImage: "https://randomuser.me/api/portraits/men/41.jpg",
        service: "Haircut & Beard Combo",
        barber: "Daniel Lee",
        helpful: 15,
        unhelpful: 3,
    },
    {
        id: 8,
        rating: 5,
        comment: "Emma is absolutely amazing with hair color! She understood exactly what I was looking for and delivered even better results than I expected. The whole staff is friendly and professional.",
        date: "2023-09-05",
        author: "David Clark",
        authorImage: "https://randomuser.me/api/portraits/men/71.jpg",
        service: "Hair Coloring",
        barber: "Emma Thompson",
        helpful: 22,
        unhelpful: 1,
    },
];

type SortOption = "newest" | "highest" | "lowest";
type FilterOption = "all" | "5" | "4" | "3" | "2" | "1";

const Reviews = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sort, setSort] = useState<SortOption>("newest");
    const [filter, setFilter] = useState<FilterOption>("all");
    const [helpfulClicks, setHelpfulClicks] = useState<{[key: number]: boolean}>({});
    const [unhelpfulClicks, setUnhelpfulClicks] = useState<{[key: number]: boolean}>({});

    // Filter and sort reviews
    const filteredAndSortedReviews = reviews
        .filter((review) => {
            // Filter by rating
            if (filter !== "all" && review.rating !== parseInt(filter)) {
                return false;
            }

            // Filter by search term
            if (searchTerm && !review.comment.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !review.author.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !review.service.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !review.barber.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            return true;
        })
        .sort((a, b) => {
            // Sort by selected option
            if (sort === "newest") {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            } else if (sort === "highest") {
                return b.rating - a.rating;
            } else if (sort === "lowest") {
                return a.rating - b.rating;
            }
            return 0;
        });

    // Handle helpful/unhelpful clicks
    const handleHelpfulClick = (id: number) => {
        if (!helpfulClicks[id]) {
            setHelpfulClicks({...helpfulClicks, [id]: true});
        }
    };

    const handleUnhelpfulClick = (id: number) => {
        if (!unhelpfulClicks[id]) {
            setUnhelpfulClicks({...unhelpfulClicks, [id]: true});
        }
    };

    // Calculate average rating
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    // Count ratings by star
    const ratingCounts = reviews.reduce((acc, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
    }, {} as {[key: number]: number});

    // Generate star rating display
    const renderStars = (rating: number) => {
        return Array(5)
            .fill(0)
            .map((_, i) => (
                <Star
                    key={i}
                    className={`h-5 w-5 ${
                        i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                    }`}
                />
            ));
    };

    return (
        <Layout>
            {/* Hero Section */}
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
                    <div className="flex items-center justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
                        <div className="flex items-center">
                            {renderStars(Math.round(averageRating))}
                            <span className="ml-2 text-white font-semibold text-xl">
                {averageRating.toFixed(1)}
              </span>
                        </div>
                        <span className="mx-2 text-white">•</span>
                        <span className="text-white">{reviews.length} reviews</span>
                    </div>
                </div>
            </section>

            {/* Reviews Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* Rating overview */}
                        <div className="bg-gray-50 p-6 rounded-lg mb-10 animate-fade-in">
                            <h2 className="text-2xl font-semibold mb-6">Rating Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col justify-center items-center">
                                    <div className="text-6xl font-bold text-barber-dark">{averageRating.toFixed(1)}</div>
                                    <div className="flex mt-2">{renderStars(Math.round(averageRating))}</div>
                                    <div className="text-gray-500 mt-2">{reviews.length} total reviews</div>
                                </div>
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = ratingCounts[star] || 0;
                                        const percentage = (count / reviews.length) * 100;

                                        return (
                                            <div key={star} className="flex items-center">
                                                <div className="w-20 text-sm flex items-center">
                                                    {star} <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                                                </div>
                                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-barber rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="w-16 text-right text-sm text-gray-500">{count}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Search, Filter and Sort */}
                        <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search reviews..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Select value={filter} onValueChange={(value) => setFilter(value as FilterOption)}>
                                        <SelectTrigger className="w-32">
                                            <div className="flex items-center">
                                                <Filter className="h-4 w-4 mr-2" />
                                                <SelectValue placeholder="Filter" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Stars</SelectItem>
                                            <SelectItem value="5">5 Stars</SelectItem>
                                            <SelectItem value="4">4 Stars</SelectItem>
                                            <SelectItem value="3">3 Stars</SelectItem>
                                            <SelectItem value="2">2 Stars</SelectItem>
                                            <SelectItem value="1">1 Star</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest</SelectItem>
                                            <SelectItem value="highest">Highest Rating</SelectItem>
                                            <SelectItem value="lowest">Lowest Rating</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div className="space-y-8">
                            {filteredAndSortedReviews.length > 0 ? (
                                filteredAndSortedReviews.map((review, index) => (
                                    <div
                                        key={review.id}
                                        className="border-b pb-8 animate-fade-in"
                                        style={{ animationDelay: `${0.1 * index}s` }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center">
                                                <img
                                                    src={review.authorImage}
                                                    alt={review.author}
                                                    className="w-12 h-12 rounded-full object-cover mr-4"
                                                />
                                                <div>
                                                    <h3 className="font-semibold">{review.author}</h3>
                                                    <div className="flex items-center mt-1">
                                                        <div className="flex mr-2">
                                                            {renderStars(review.rating)}
                                                        </div>
                                                        <span className="text-gray-500 text-sm">
                              {new Date(review.date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                              })}
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

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex space-x-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-500 hover:text-barber flex items-center"
                                                    onClick={() => handleHelpfulClick(review.id)}
                                                    disabled={!!helpfulClicks[review.id]}
                                                >
                                                    <ThumbsUp className={`h-4 w-4 mr-1 ${helpfulClicks[review.id] ? 'text-barber' : ''}`} />
                                                    Helpful ({review.helpful + (helpfulClicks[review.id] ? 1 : 0)})
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-500 hover:text-barber flex items-center"
                                                    onClick={() => handleUnhelpfulClick(review.id)}
                                                    disabled={!!unhelpfulClicks[review.id]}
                                                >
                                                    <ThumbsDown className={`h-4 w-4 mr-1 ${unhelpfulClicks[review.id] ? 'text-barber' : ''}`} />
                                                    Not Helpful ({review.unhelpful + (unhelpfulClicks[review.id] ? 1 : 0)})
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-lg text-gray-500">No reviews match your filters.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setFilter("all");
                                            setSort("newest");
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Reviews;
