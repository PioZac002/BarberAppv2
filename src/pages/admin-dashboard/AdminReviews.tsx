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
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Updated Review interface with names instead of IDs
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

// Define sortable fields
type SortField = 'client_name' | 'barber_name' | 'service_name' | 'rating';

const AdminReviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/admin/reviews', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                if (!response.ok) throw new Error('Failed to fetch reviews');
                const data = await response.json();
                setReviews(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setLoading(false);
                toast.error('Failed to fetch reviews');
            }
        };

        fetchReviews();
    }, []);

    // Sorting function
    const sortReviews = (reviews: Review[], sortField: SortField | null, sortOrder: 'asc' | 'desc') => {
        if (!sortField) return reviews; // Maintain original order if no sort field is selected
        return [...reviews].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }
            return 0;
        });
    };

    // Handle sort toggle
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedReviews = sortReviews(reviews, sortField, sortOrder);

    const handleDeleteClick = (review: Review) => {
        setSelectedReview(review);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedReview) return;
        try {
            const response = await fetch(`http://localhost:3000/api/admin/reviews/${selectedReview.id}`, {
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
            </CardHeader>
            <CardContent>
                {sortedReviews.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Appointment ID</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('client_name')}>
                                    Client Name
                                    {sortField === 'client_name' && (
                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />
                                    )}
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('barber_name')}>
                                    Barber Name
                                    {sortField === 'barber_name' && (
                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />
                                    )}
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('service_name')}>
                                    Service Name
                                    {sortField === 'service_name' && (
                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />
                                    )}
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('rating')}>
                                    Rating
                                    {sortField === 'rating' && (
                                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />
                                    )}
                                </TableHead>
                                <TableHead>Comment</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedReviews.map((review) => (
                                <TableRow key={review.id}>
                                    <TableCell>{review.id}</TableCell>
                                    <TableCell>{review.appointment_id}</TableCell>
                                    <TableCell>{review.client_name}</TableCell>
                                    <TableCell>{review.barber_name}</TableCell>
                                    <TableCell>{review.service_name}</TableCell>
                                    <TableCell>{review.rating}</TableCell>
                                    <TableCell>{review.comment}</TableCell>
                                    <TableCell>{new Date(review.created_at).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
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
                ) : (
                    <div className="text-center py-8">
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
                        <div>
                            <p><strong>ID:</strong> {selectedReview.id}</p>
                            <p><strong>Appointment ID:</strong> {selectedReview.appointment_id}</p>
                            <p><strong>Rating:</strong> {selectedReview.rating}</p>
                            <p><strong>Comment:</strong> {selectedReview.comment}</p>
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