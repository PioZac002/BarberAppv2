import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Star } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Interface and type definitions remain the same
interface Review {
    id: number;
    appointment_id: number;
    client_name: string;
    barber_name: string;
    service_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

type SortField = 'client_name' | 'barber_name' | 'service_name' | 'rating' | 'created_at';

const AdminReviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                if (!response.ok) throw new Error('Failed to fetch reviews');
                const data = await response.json();
                setReviews(data);
            } catch (error) {
                console.error('Error fetching reviews:', error);
                toast.error('Failed to fetch reviews');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    const handleSort = (field: SortField) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
    };

    const sortedReviews = [...reviews].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const handleDeleteClick = (review: Review) => {
        setSelectedReview(review);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedReview) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews/${selectedReview.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!response.ok) throw new Error('Failed to delete review');
            setReviews(reviews.filter((review) => review.id !== selectedReview.id));
            setIsDeleteModalOpen(false);
            setSelectedReview(null);
            toast.success('Review deleted successfully');
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Failed to delete review');
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, index) => (
                    <Star
                        key={index}
                        className={`h-4 w-4 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reviews Management</CardTitle>
                {/* POPRAWKA: Zastąpiono DialogDescription zwykłym paragrafem */}
                <p className="text-sm text-muted-foreground">
                    Browse and manage all customer reviews.
                </p>
            </CardHeader>
            <CardContent>
                {sortedReviews.length > 0 ? (
                    <>
                        {/* WIDOK NA KOMPUTERY */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('client_name')}>Client {sortField === 'client_name' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />)}</TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('barber_name')}>Barber {sortField === 'barber_name' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />)}</TableHead>
                                        <TableHead>Comment</TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('rating')}>Rating {sortField === 'rating' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />)}</TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>Date {sortField === 'created_at' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />)}</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedReviews.map((review) => (
                                        <TableRow key={review.id}>
                                            <TableCell className="font-medium">{review.client_name}</TableCell>
                                            <TableCell>{review.barber_name}</TableCell>
                                            <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                                            <TableCell>{renderStars(review.rating)}</TableCell>
                                            <TableCell>{new Date(review.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => handleDeleteClick(review)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* WIDOK NA URZĄDZENIA MOBILNE */}
                        <div className="md:hidden space-y-4">
                            {sortedReviews.map((review) => (
                                <div key={review.id} className="border rounded-lg p-4 space-y-3 shadow-sm bg-white">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-gray-800">{review.client_name}</div>
                                        {renderStars(review.rating)}
                                    </div>
                                    <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                    <div className="text-xs text-gray-500 pt-2 border-t space-y-1">
                                        <p><strong>Barber:</strong> {review.barber_name}</p>
                                        <p><strong>Service:</strong> {review.service_name}</p>
                                        <p><strong>Date:</strong> {new Date(review.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteClick(review)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-gray-500">No reviews found.</p>
                    </div>
                )}
            </CardContent>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Review</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this review? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReview && (
                        <div className="py-4 space-y-2 border-t border-b">
                            <p><strong>Client:</strong> {selectedReview.client_name}</p>
                            <p><strong>Barber:</strong> {selectedReview.barber_name}</p>
                            <p><strong>Rating:</strong> {selectedReview.rating} / 5</p>
                            <p className="italic">"{selectedReview.comment}"</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AdminReviews;
