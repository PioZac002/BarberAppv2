// src/pages/barber-dashboard/BarberProfile.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Clock,
    Star,
    Edit,
    Save,
    X,
    Briefcase,
    Instagram,
    Facebook,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface BarberProfileData {
    firstName: string;
    lastName: string;
    user_email: string;
    user_phone: string;
    barber_table_id: number;
    bio?: string;
    address?: string;
    working_hours?: string;
    instagram?: string;
    facebook?: string;
    specialties?: string[] | string;
    experience?: string | number;
    rating?: number;
    totalReviews?: number;
    profile_image_url?: string;
}

const BarberProfilePage = () => {
    const {
        user: authUser,
        token,
        loading: authContextLoading,
        updateUserContext,
    } = useAuth();

    const [profile, setProfile] = useState<BarberProfileData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableBarberData, setEditableBarberData] = useState({
        bio: "",
        address: "",
        working_hours: "",
        instagram: "",
        facebook: "",
        specialties: "",
        experience: "",
        profile_image_url: "",
    });
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (authContextLoading) {
            setIsLoadingData(true);
            return;
        }
        if (!authUser || !token) {
            setIsLoadingData(false);
            setProfile(null);
            return;
        }

        const fetchProfile = async () => {
            if (!token) return;
            setIsLoadingData(true);
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/barber/profile`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!response.ok) {
                    const errorData = await response
                        .json()
                        .catch(() => ({
                            error: "Nie udało się pobrać profilu",
                        }));
                    throw new Error(
                        errorData.error || "Nie udało się pobrać profilu"
                    );
                }
                const data: BarberProfileData = await response.json();
                setProfile(data);
                setEditableBarberData({
                    bio: data.bio || "",
                    address: data.address || "",
                    working_hours: data.working_hours || "",
                    instagram: data.instagram || "",
                    facebook: data.facebook || "",
                    specialties: Array.isArray(data.specialties)
                        ? data.specialties.join(", ")
                        : data.specialties || "",
                    experience:
                        typeof data.experience === "number"
                            ? String(data.experience)
                            : data.experience || "",
                    profile_image_url: data.profile_image_url || "",
                });
            } catch (error: any) {
                console.error("Error fetching profile:", error);
                toast.error(
                    error.message || "Nie udało się wczytać profilu"
                );
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchProfile();
    }, [authUser, token, authContextLoading, updateUserContext]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setEditableBarberData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!token || !profile) {
            toast.error("Błąd uwierzytelniania lub brak danych profilu.");
            return;
        }
        try {
            const payload = {
                ...editableBarberData,
                specialties: editableBarberData.specialties
                    .split(",")
                    .map(s => s.trim())
                    .filter(s => s),
            };

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/barber/profile`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({
                        error: "Nie udało się zaktualizować profilu",
                    }));
                throw new Error(
                    errorData.error || "Nie udało się zaktualizować profilu"
                );
            }
            const updatedProfile: BarberProfileData = await response.json();
            setProfile(updatedProfile);
            setEditableBarberData({
                bio: updatedProfile.bio || "",
                address: updatedProfile.address || "",
                working_hours: updatedProfile.working_hours || "",
                instagram: updatedProfile.instagram || "",
                facebook: updatedProfile.facebook || "",
                specialties: Array.isArray(updatedProfile.specialties)
                    ? updatedProfile.specialties.join(", ")
                    : updatedProfile.specialties || "",
                experience:
                    typeof updatedProfile.experience === "number"
                        ? String(updatedProfile.experience)
                        : updatedProfile.experience || "",
                profile_image_url: updatedProfile.profile_image_url || "",
            });
            setIsEditing(false);
            toast.success("Profil został pomyślnie zaktualizowany!");
        } catch (error: any) {
            console.error("Error saving profile:", error);
            toast.error(
                error.message || "Nie udało się zaktualizować profilu"
            );
        }
    };

    const handleCancel = () => {
        if (profile) {
            setEditableBarberData({
                bio: profile.bio || "",
                address: profile.address || "",
                working_hours: profile.working_hours || "",
                instagram: profile.instagram || "",
                facebook: profile.facebook || "",
                specialties: Array.isArray(profile.specialties)
                    ? profile.specialties.join(", ")
                    : profile.specialties || "",
                experience:
                    typeof profile.experience === "number"
                        ? String(profile.experience)
                        : profile.experience || "",
                profile_image_url: profile.profile_image_url || "",
            });
        }
        setIsEditing(false);
    };

    if (authContextLoading || isLoadingData) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">
                    Nie udało się wczytać danych profilu.
                </p>
                <Button
                    asChild
                    className="mt-4 bg-barber hover:bg-barber-muted"
                >
                    <Link to="/barber-dashboard">
                        Wróć do podsumowania
                    </Link>
                </Button>
            </div>
        );
    }

    const displaySpecialties = Array.isArray(profile.specialties)
        ? profile.specialties
        : typeof profile.specialties === "string" &&
        profile.specialties.length > 0
            ? profile.specialties.split(",").map(s => s.trim())
            : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center">
                                <User className="h-5 w-5 mr-2 text-barber" />
                                Podgląd profilu
                            </div>
                            {!isEditing && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edytuj dane
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="h-24 w-24 mb-4 border-2 border-barber">
                                <AvatarImage
                                    src={profile.profile_image_url}
                                    alt={`${profile.firstName} ${profile.lastName}`}
                                />
                                <AvatarFallback className="bg-barber text-white text-3xl">
                                    {profile.firstName?.[0]?.toUpperCase()}
                                    {profile.lastName?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="text-2xl font-semibold text-gray-800">
                                {profile.firstName} {profile.lastName}
                            </h3>
                            <p className="text-barber">Profesjonalny barber</p>
                        </div>

                        <div className="text-sm text-gray-600 space-y-2">
                            {profile.rating !== undefined &&
                                profile.totalReviews !== undefined && (
                                    <div className="flex items-center justify-center">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                        <span className="font-medium text-gray-700">
                                            {profile.rating.toFixed(1)}
                                        </span>
                                        <span className="ml-1">
                                            ({profile.totalReviews} opinii)
                                        </span>
                                    </div>
                                )}
                            {profile.address && !isEditing && (
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span>{profile.address}</span>
                                </div>
                            )}
                            {profile.working_hours && !isEditing && (
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span>{profile.working_hours}</span>
                                </div>
                            )}
                            {profile.experience && !isEditing && (
                                <div className="flex items-center">
                                    <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span>{profile.experience}</span>
                                </div>
                            )}
                        </div>

                        {displaySpecialties.length > 0 && !isEditing && (
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">
                                    Specjalizacje:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {displaySpecialties.map(
                                        (specialty, index) => (
                                            <Badge
                                                key={index}
                                                variant="secondary"
                                                className="bg-barber/10 text-barber"
                                            >
                                                {specialty}
                                            </Badge>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        {profile.bio && !isEditing && (
                            <div>
                                <h4 className="font-medium text-gray-700 mb-1 text-sm">
                                    O mnie:
                                </h4>
                                <p className="text-sm text-gray-600 whitespace-pre-line">
                                    {profile.bio}
                                </p>
                            </div>
                        )}
                        {profile.instagram && !isEditing && (
                            <div className="flex items-center text-sm">
                                <Instagram className="h-4 w-4 mr-2 text-pink-600 flex-shrink-0" />
                                <a
                                    href={`https://instagram.com/${profile.instagram}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    @{profile.instagram}
                                </a>
                            </div>
                        )}
                        {profile.facebook && !isEditing && (
                            <div className="flex items-center text-sm">
                                <Facebook className="h-4 w-4 mr-2 text-blue-700 flex-shrink-0" />
                                <a
                                    href={profile.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    Zobacz profil
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            {isEditing
                                ? "Edytuj szczegóły profilu"
                                : "Szczegóły profilu"}
                            {isEditing && (
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Anuluj
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        className="bg-barber hover:bg-barber-muted"
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        Zapisz zmiany
                                    </Button>
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="border-b pb-4 mb-4">
                            <h4 className="text-md font-semibold text-gray-700 mb-3">
                                Informacje o koncie (tylko do odczytu)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                    <div>
                                        <p className="text-gray-500">
                                            Imię i nazwisko
                                        </p>
                                        <p className="text-gray-800">
                                            {profile.firstName}{" "}
                                            {profile.lastName}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                    <div>
                                        <p className="text-gray-500">
                                            Email
                                        </p>
                                        <p className="text-gray-800">
                                            {profile.user_email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                    <div>
                                        <p className="text-gray-500">
                                            Telefon
                                        </p>
                                        <p className="text-gray-800">
                                            {profile.user_phone ||
                                                "Brak danych"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-md font-semibold text-gray-700 mb-3">
                                Dane barbera {isEditing && "(edytowalne)"}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="bio">O mnie</Label>
                                    {isEditing ? (
                                        <Textarea
                                            id="bio"
                                            name="bio"
                                            value={editableBarberData.bio}
                                            onChange={handleInputChange}
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-line min-h-[80px]">
                                            {profile.bio || "Brak opisu."}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="address">Adres</Label>
                                    {isEditing ? (
                                        <Input
                                            id="address"
                                            name="address"
                                            value={editableBarberData.address}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-700 min-h-[40px] flex items-center">
                                            {profile.address || "Brak danych"}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="working_hours">
                                        Godziny pracy
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="working_hours"
                                            name="working_hours"
                                            value={
                                                editableBarberData.working_hours
                                            }
                                            onChange={handleInputChange}
                                            placeholder="np. 09:00-17:00 (format HH:MM-HH:MM)"
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-700 min-h-[40px] flex items-center">
                                            {profile.working_hours ||
                                                "Nie podano"}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="experience">
                                        Doświadczenie
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="experience"
                                            name="experience"
                                            value={
                                                editableBarberData.experience
                                            }
                                            onChange={handleInputChange}
                                            placeholder="np. 5 lat"
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-700 min-h-[40px] flex items-center">
                                            {profile.experience || "Nie podano"}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="specialties">
                                        Specjalizacje (oddzielone przecinkami)
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="specialties"
                                            name="specialties"
                                            value={
                                                editableBarberData.specialties
                                            }
                                            onChange={handleInputChange}
                                            placeholder="np. fade, trymowanie brody"
                                        />
                                    ) : displaySpecialties.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-1 min-h-[40px] items-center">
                                            {displaySpecialties.map((s, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                >
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700 min-h-[40px] flex items-center">
                                            Brak podanych specjalizacji.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="profile_image_url">
                                        Adres URL zdjęcia profilowego
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="profile_image_url"
                                            name="profile_image_url"
                                            value={
                                                editableBarberData.profile_image_url
                                            }
                                            onChange={handleInputChange}
                                            placeholder="https://example.com/zdjecie.jpg"
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-700 truncate min-h-[40px] flex items-center">
                                            {profile.profile_image_url ||
                                                "Brak danych"}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="instagram">
                                        Nazwa użytkownika na Instagramie
                                    </Label>
                                    {isEditing ? (
                                        <div className="flex items-center">
                                            <Instagram className="h-4 w-4 mr-2 text-gray-400" />
                                            <Input
                                                id="instagram"
                                                name="instagram"
                                                value={
                                                    editableBarberData.instagram
                                                }
                                                onChange={handleInputChange}
                                                placeholder="twoj_instagram"
                                            />
                                        </div>
                                    ) : profile.instagram ? (
                                        <a
                                            href={`https://instagram.com/${profile.instagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center min-h-[40px]"
                                        >
                                            <Instagram className="h-4 w-4 mr-1" />
                                            @{profile.instagram}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-gray-700 min-h-[40px] flex items-center">
                                            Brak danych
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="facebook">
                                        Adres profilu na Facebooku
                                    </Label>
                                    {isEditing ? (
                                        <div className="flex items-center">
                                            <Facebook className="h-4 w-4 mr-2 text-gray-400" />
                                            <Input
                                                id="facebook"
                                                name="facebook"
                                                value={
                                                    editableBarberData.facebook
                                                }
                                                onChange={handleInputChange}
                                                placeholder="https://facebook.com/twojprofil"
                                            />
                                        </div>
                                    ) : profile.facebook ? (
                                        <a
                                            href={profile.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center min-h-[40px]"
                                        >
                                            <Facebook className="h-4 w-4 mr-1" />
                                            Zobacz profil
                                        </a>
                                    ) : (
                                        <p className="text-sm text-gray-700 min-h-[40px] flex items-center">
                                            Brak danych
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BarberProfilePage;
