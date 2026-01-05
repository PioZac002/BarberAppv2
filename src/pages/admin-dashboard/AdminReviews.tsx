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
                if (!response.ok) throw new Error('Nie udało się pobrać opinii');
                const data = await response.json();
                setReviews(data);
            } catch (error) {
                console.error('Error fetching reviews:', error);
                toast.error('Nie udało się pobrać opinii');
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
            if (!response.ok) throw new Error('Nie udało się usunąć opinii');
            setReviews(reviews.filter((review) => review.id !== selectedReview.id));
            setIsDeleteModalOpen(false);
            setSelectedReview(null);
            toast.success('Opinia została pomyślnie usunięta');
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Nie udało się usunąć opinii');
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
                <CardTitle>Zarządzanie opiniami</CardTitle>
                {/* POPRAWKA: Zastąpiono DialogDescription zwykłym paragrafem */}
                <p className="text-sm text-muted-foreground">
                    Przeglądaj oraz zarządzaj opiniami klientów.
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
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('client_name')}>
                                            Klient {sortField === 'client_name' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />)}
                                        </TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('barber_name')}>
                                            Barber {sortField === 'barber_name' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />)}
                                        </TableHead>
                                        <TableHead>Komentarz</TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('rating')}>
                                            Ocena {sortField === 'rating' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />)}
                                        </TableHead>
                                        <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                                            Data {sortField === 'created_at' && (sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 inline ml-1" /> : <ArrowDown className="h-4 w-4 inline ml-1" />)}
                                        </TableHead>
                                        <TableHead className="text-right">Akcje</TableHead>
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
                                        <p><strong>Usługa:</strong> {review.service_name}</p>
                                        <p><strong>Data:</strong> {new Date(review.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteClick(review)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1.5" />
                                            Usuń
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-gray-500">Nie znaleziono żadnych opinii</p>
                    </div>
                )}
            </CardContent>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Usuń opinię</DialogTitle>
                        <DialogDescription>
                            Czy na pewno chcesz usunąć tę recenzję? Tej czynności nie można cofnąć.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReview && (
                        <div className="py-4 space-y-2 border-t border-b">
                            <p><strong>Klient:</strong> {selectedReview.client_name}</p>
                            <p><strong>Barber:</strong> {selectedReview.barber_name}</p>
                            <p><strong>Ocena:</strong> {selectedReview.rating} / 5</p>
                            <p className="italic">"{selectedReview.comment}"</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Anuluj
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Usuń
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AdminReviews;
