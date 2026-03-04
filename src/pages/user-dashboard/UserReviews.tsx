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
import { pl, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

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
    const { t, lang } = useLanguage();
    const dateLocale = lang === "pl" ? pl : enUS;

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
                    toast.error(t("userPanel.reviews.loadFailed"));
                }

                if (appointmentsToReviewRes.ok) {
                    const appointmentsData = await appointmentsToReviewRes.json();
                    setAppointmentsToReview(appointmentsData);
                } else {
                    toast.error(t("userPanel.reviews.loadFailed"));
                }

            } catch (error) {
                toast.error(t("userPanel.reviews.loadFailed"));
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
            toast.error(t("userPanel.reviews.selectVisit"));
            return;
        }
        if (newReviewData.rating === 0) {
            toast.error(t("userPanel.reviews.provideRating"));
            return;
        }
        if (!newReviewData.comment.trim()) {
            toast.error(t("userPanel.reviews.writeComment"));
            return;
        }
        if (!token) {
            toast.error(t("userPanel.reviews.authError"));
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
                let errorMsg = t("userPanel.reviews.addFailed");
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {/*ignore*/}
                throw new Error(errorMsg);
            }

            const addedReview = await response.json();
            setReviews(prevReviews =>
                [addedReview, ...prevReviews].sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                )
            );
            setAppointmentsToReview(prev =>
                prev.filter(apt => apt.appointment_id !== parseInt(newReviewData.appointment_id, 10))
            );
            setNewReviewData({ appointment_id: "", rating: 0, comment: "" });
            setIsDialogOpen(false);
            toast.success(t("userPanel.reviews.added"));
        } catch (error: any) {
            toast.error(error.message || t("userPanel.reviews.addFailed"));
        }
    };

    const averageRating =
        reviews.length > 0
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
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
                <p className="text-red-500">{t("userPanel.authErrorDesc")}</p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                    <Link to="/login">{t("userPanel.goToLogin")}</Link>
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
                            {t("userPanel.reviews.summary")}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            {t("userPanel.reviews.summaryDesc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-2xl sm:text-3xl font-bold text-barber">
                                {reviews.length}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {t("userPanel.reviews.count")}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-baseline space-x-1">
                                <div className="text-2xl sm:text-3xl font-bold text-barber">
                                    {averageRating.toFixed(1)}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {t("userPanel.reviews.outOf")}
                                </span>
                            </div>
                            <div className="flex mt-1">
                                {renderStars(Math.round(averageRating))}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                {t("userPanel.reviews.avgRating")}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-center items-center">
                    <CardContent className="pt-6 text-center">
                        <MessageSquare className="h-10 w-10 text-barber mx-auto mb-2" />
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-barber hover:bg-barber-muted"
                                    disabled={appointmentsToReview.length === 0 && !isLoading}
                                    onClick={() => {
                                        if (!newReviewData.appointment_id && appointmentsToReview.length > 0) {
                                            setNewReviewData({
                                                appointment_id: String(appointmentsToReview[0].appointment_id),
                                                rating: 0,
                                                comment: "",
                                            });
                                        } else if (appointmentsToReview.length === 0) {
                                            setNewReviewData({ appointment_id: "", rating: 0, comment: "" });
                                        }
                                        setIsDialogOpen(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t("userPanel.reviews.writeNew")}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>{t("userPanel.reviews.addReview")}</DialogTitle>
                                    <DialogDescription>
                                        {t("userPanel.reviews.addReviewDesc")}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div>
                                        <Label htmlFor="appointmentToReview" className="text-sm font-medium">
                                            {t("userPanel.reviews.appointmentToReview")}
                                        </Label>
                                        <Select
                                            value={newReviewData.appointment_id}
                                            onValueChange={value => handleNewReviewChange("appointment_id", value)}
                                            disabled={appointmentsToReview.length === 0}
                                        >
                                            <SelectTrigger id="appointmentToReview" className="mt-1">
                                                <SelectValue placeholder={t("userPanel.reviews.selectAppointment")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {appointmentsToReview.length > 0 ? (
                                                    appointmentsToReview.map(apt => (
                                                        <SelectItem
                                                            key={apt.appointment_id}
                                                            value={String(apt.appointment_id)}
                                                        >
                                                            {apt.display_text}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-sm text-center text-muted-foreground">
                                                        {t("userPanel.reviews.noAppointmentsToReview")}
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">
                                            {t("userPanel.reviews.yourRating")}
                                        </Label>
                                        <div className="flex mt-1.5">
                                            {renderStars(
                                                newReviewData.rating,
                                                true,
                                                rating => handleNewReviewChange("rating", rating)
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="reviewComment" className="text-sm font-medium">
                                            {t("userPanel.reviews.yourComment")}
                                        </Label>
                                        <Textarea
                                            id="reviewComment"
                                            className="mt-1"
                                            placeholder={t("userPanel.reviews.commentPlaceholder")}
                                            value={newReviewData.comment}
                                            onChange={e => handleNewReviewChange("comment", e.target.value)}
                                            rows={5}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="mt-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="outline"
                                            onClick={() => setNewReviewData({ appointment_id: "", rating: 0, comment: "" })}
                                        >
                                            {t("userPanel.reviews.cancel")}
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
                                        {t("userPanel.reviews.submit")}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {appointmentsToReview.length === 0 && !isLoading && (
                            <p className="text-xs text-muted-foreground mt-2">
                                {t("userPanel.reviews.noNewToReview")}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-3 text-foreground">
                    {t("userPanel.reviews.myReviews")}
                </h2>
                <div className="space-y-4">
                    {reviews.length > 0 ? (
                        reviews.map(review => (
                            <Card key={review.id} className="shadow-sm">
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
                                            <p className="text-xs text-muted-foreground">
                                                {t("userPanel.reviews.addedPrefix")}
                                                {isValid(new Date(review.date))
                                                    ? format(new Date(review.date), "PPP", { locale: dateLocale })
                                                    : t("userPanel.reviews.noData")}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-foreground text-sm mb-3 leading-relaxed">
                                        {review.comment}
                                    </p>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <User className="h-3.5 w-3.5 mr-1" />
                                        <span>{t("userPanel.reviews.barberLabel")}{review.barber}</span>
                                        {review.appointmentDate && (
                                            <>
                                                <span className="mx-2">|</span>
                                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                                <span>
                                                    {isValid(new Date(review.appointmentDate))
                                                        ? format(new Date(review.appointmentDate), "PPP", { locale: dateLocale })
                                                        : t("userPanel.reviews.noData")}
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
                                <Info className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <h3 className="text-md font-medium text-foreground mb-1">
                                    {t("userPanel.reviews.noReviews")}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {t("userPanel.reviews.noReviewsDesc")}
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
