import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Star, Calendar, User, Plus, MessageSquare, Info } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isValid, format } from "date-fns";
import { pl } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Review {
    id: number;
    rating: number;
    comment: string;
    date: string;
    service: string;
    barber: string;
    appointmentDate?: string;
}

interface AppointmentToReview {
    appointment_id: number;
    service_name: string;
    barber_name: string;
    display_text: string;
}

const UserReviews = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    useRequireAuth({ allowedRoles: ["client"] });

    const [reviews, setReviews] = useState<Review[]>([]);
    const [appointmentsToReview, setAppointmentsToReview] = useState<AppointmentToReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [newReviewData, setNewReviewData] = useState<{
        appointment_id: string;
        rating: number;
        comment: string;
    }>({
        appointment_id: "",
        rating: 0,
        comment: "",
    });

    useEffect(() => {
        if (authContextLoading) {
            setIsLoading(true);
            return;
        }
        if (!token || !authUser) {
            setIsLoading(false);
            setReviews([]);
            setAppointmentsToReview([]);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [reviewsRes, appointmentsToReviewRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/reviews`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/user/appointments/completed-unreviewed`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json();
                    setReviews(reviewsData);
                } else {
                    toast.error("Nie udało się wczytać Twoich opinii.");
                    console.error("Failed to fetch user reviews:", await reviewsRes.text());
                }

                if (appointmentsToReviewRes.ok) {
                    const appointmentsData = await appointmentsToReviewRes.json();
                    setAppointmentsToReview(appointmentsData);
                } else {
                    toast.error("Nie udało się wczytać wizyt dostępnych do oceny.");
                    console.error("Failed to fetch appointments to review:", await appointmentsToReviewRes.text());
                }

            } catch (error) {
                console.error("Error fetching reviews data:", error);
                toast.error("Wystąpił błąd podczas ładowania danych o opiniach.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [authUser, token, authContextLoading]);

    const renderStars = (
        currentRating: number,
        interactive = false,
        onRate?: (rating: number) => void
    ) => {
        return (
            <div className="flex">
                {Array(5)
                    .fill(0)
                    .map((_, i) => (
                        <Star
                            key={i}
                            className={`h-6 w-6 sm:h-7 sm:w-7 ${
                                i < currentRating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                            } ${interactive ? "cursor-pointer hover:text-yellow-300" : ""}`}
                            onClick={interactive && onRate ? () => onRate(i + 1) : undefined}
                        />
                    ))}
            </div>
        );
    };

    const handleNewReviewChange = (
        field: keyof typeof newReviewData,
        value: string | number
    ) => {
        setNewReviewData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmitReview = async () => {
        if (!newReviewData.appointment_id) {
            toast.error("Wybierz wizytę, którą chcesz ocenić.");
            return;
        }
        if (newReviewData.rating === 0) {
            toast.error("Podaj ocenę w skali 1–5 gwiazdek.");
            return;
        }
        if (!newReviewData.comment.trim()) {
            toast.error("Napisz komentarz do swojej opinii.");
            return;
        }
        if (!token) {
            toast.error("Błąd uwierzytelniania.");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointment_id: parseInt(newReviewData.appointment_id, 10),
                    rating: newReviewData.rating,
                    comment: newReviewData.comment,
                }),
            });

            if (!response.ok) {
                let errorMsg = "Nie udało się dodać opinii";
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {/*ignore*/}
                throw new Error(errorMsg);
            }

            const addedReview = await response.json();
            setReviews(prevReviews =>
                [addedReview, ...prevReviews].sort(
                    (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                )
            );
            setAppointmentsToReview(prev =>
                prev.filter(
                    apt =>
                        apt.appointment_id !==
                        parseInt(newReviewData.appointment_id, 10)
                )
            );
            setNewReviewData({ appointment_id: "", rating: 0, comment: "" });
            setIsDialogOpen(false);
            toast.success("Opinia została pomyślnie dodana!");
        } catch (error: any) {
            toast.error(error.message || "Nie udało się dodać opinii.");
        }
    };

    const averageRating =
        reviews.length > 0
            ? reviews.reduce((acc, review) => acc + review.rating, 0) /
            reviews.length
            : 0;

    if (authContextLoading || isLoading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">
                    Zaloguj się, aby zarządzać swoimi opiniami.
                </p>
                <Button
                    asChild
                    className="mt-4 bg-barber hover:bg-barber-muted"
                >
                    <Link to="/login">Przejdź do logowania</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg sm:text-xl">
                            Podsumowanie Twoich opinii
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Krótkie statystyki dotyczące Twoich dotychczasowych
                            ocen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold text-barber">
                                {reviews.length}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500">
                                Liczba wystawionych opinii
                            </p>
                        </div>
                        <div>
                            <div className="flex items-baseline space-x-1">
                                <div className="text-2xl sm:text-3xl font-bold text-barber">
                                    {averageRating.toFixed(1)}
                                </div>
                                <span className="text-sm text-gray-500">
                                    / 5.0
                                </span>
                            </div>
                            <div className="flex mt-1">
                                {renderStars(Math.round(averageRating))}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                Średnia ocena
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-center items-center">
                    <CardContent className="pt-6 text-center">
                        <MessageSquare className="h-10 w-10 text-barber mx-auto mb-2" />
                        <Dialog
                            open={isDialogOpen}
                            onOpenChange={setIsDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-barber hover:bg-barber-muted"
                                    disabled={
                                        appointmentsToReview.length === 0 &&
                                        !isLoading
                                    }
                                    onClick={() => {
                                        if (
                                            !newReviewData.appointment_id &&
                                            appointmentsToReview.length > 0
                                        ) {
                                            setNewReviewData({
                                                appointment_id: String(
                                                    appointmentsToReview[0]
                                                        .appointment_id
                                                ),
                                                rating: 0,
                                                comment: "",
                                            });
                                        } else if (
                                            appointmentsToReview.length === 0
                                        ) {
                                            setNewReviewData({
                                                appointment_id: "",
                                                rating: 0,
                                                comment: "",
                                            });
                                        }
                                        setIsDialogOpen(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Napisz nową opinię
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Dodaj opinię</DialogTitle>
                                    <DialogDescription>
                                        Podziel się swoją opinią na temat
                                        zakończonej wizyty.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div>
                                        <Label
                                            htmlFor="appointmentToReview"
                                            className="text-sm font-medium"
                                        >
                                            Wizyta do oceny
                                        </Label>
                                        <Select
                                            value={newReviewData.appointment_id}
                                            onValueChange={value =>
                                                handleNewReviewChange(
                                                    "appointment_id",
                                                    value
                                                )
                                            }
                                            disabled={
                                                appointmentsToReview.length ===
                                                0
                                            }
                                        >
                                            <SelectTrigger
                                                id="appointmentToReview"
                                                className="mt-1"
                                            >
                                                <SelectValue placeholder="Wybierz zakończoną wizytę" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {appointmentsToReview.length >
                                                0 ? (
                                                    appointmentsToReview.map(
                                                        apt => (
                                                            <SelectItem
                                                                key={
                                                                    apt.appointment_id
                                                                }
                                                                value={String(
                                                                    apt.appointment_id
                                                                )}
                                                            >
                                                                {
                                                                    apt.display_text
                                                                }
                                                            </SelectItem>
                                                        )
                                                    )
                                                ) : (
                                                    <div className="p-4 text-sm text-center text-gray-500">
                                                        Brak nowych wizyt do
                                                        oceny.
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Twoja ocena
                                        </Label>
                                        <div className="flex mt-1.5">
                                            {renderStars(
                                                newReviewData.rating,
                                                true,
                                                rating =>
                                                    handleNewReviewChange(
                                                        "rating",
                                                        rating
                                                    )
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="reviewComment"
                                            className="text-sm font-medium"
                                        >
                                            Twój komentarz
                                        </Label>
                                        <Textarea
                                            id="reviewComment"
                                            className="mt-1"
                                            placeholder="Opisz swoje doświadczenie z wizyty..."
                                            value={newReviewData.comment}
                                            onChange={e =>
                                                handleNewReviewChange(
                                                    "comment",
                                                    e.target.value
                                                )
                                            }
                                            rows={5}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="mt-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setNewReviewData({
                                                    appointment_id: "",
                                                    rating: 0,
                                                    comment: "",
                                                })
                                            }
                                        >
                                            Anuluj
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        className="bg-barber hover:bg-barber-muted"
                                        onClick={handleSubmitReview}
                                        disabled={
                                            !newReviewData.appointment_id ||
                                            newReviewData.rating === 0 ||
                                            !newReviewData.comment.trim()
                                        }
                                    >
                                        Wyślij opinię
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {appointmentsToReview.length === 0 && !isLoading && (
                            <p className="text-xs text-gray-500 mt-2">
                                Nie masz obecnie nowych wizyt do oceny.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-800">
                    Moje dotychczasowe opinie
                </h2>
                <div className="space-y-4">
                    {reviews.length > 0 ? (
                        reviews.map(review => (
                            <Card
                                key={review.id}
                                className="shadow-sm"
                            >
                                <CardContent className="pt-5 pb-5 px-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center mb-1.5">
                                                <div className="flex mr-2">
                                                    {renderStars(review.rating)}
                                                </div>
                                                <h3 className="font-semibold text-barber text-md leading-tight">
                                                    {review.service}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Dodano:{" "}
                                                {isValid(
                                                    new Date(review.date)
                                                )
                                                    ? format(
                                                        new Date(
                                                            review.date
                                                        ),
                                                        "PPP",
                                                        { locale: pl }
                                                    )
                                                    : "Brak danych"}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                                        {review.comment}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <User className="h-3.5 w-3.5 mr-1" />
                                        <span>Barber: {review.barber}</span>
                                        {review.appointmentDate && (
                                            <>
                                                <span className="mx-2">|</span>
                                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                                <span>
                                                    Wizyta:{" "}
                                                    {isValid(
                                                        new Date(
                                                            review.appointmentDate
                                                        )
                                                    )
                                                        ? format(
                                                            new Date(
                                                                review.appointmentDate
                                                            ),
                                                            "PPP",
                                                            { locale: pl }
                                                        )
                                                        : "Brak danych"}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <Info className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-md font-medium text-gray-700 mb-1">
                                    Nie dodałeś jeszcze żadnej opinii.
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Po swojej następnej wizycie podziel się
                                    doświadczeniem!
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserReviews;
