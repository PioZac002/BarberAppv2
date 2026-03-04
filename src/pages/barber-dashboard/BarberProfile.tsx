// src/pages/barber-dashboard/BarberProfile.tsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
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
    Camera,
    Upload,
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
    const { t } = useLanguage();

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
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: t("barberPanel.profile.loadFailed") }));
                    throw new Error(errorData.error || t("barberPanel.profile.loadFailed"));
                }
                const data: BarberProfileData = await response.json();
                setProfile(data);
                setPhotoPreview(data.profile_image_url || "");
                setEditableBarberData({
                    bio: data.bio || "",
                    address: data.address || "",
                    working_hours: data.working_hours || "",
                    instagram: data.instagram || "",
                    facebook: data.facebook || "",
                    specialties: Array.isArray(data.specialties)
                        ? data.specialties.join(", ")
                        : data.specialties || "",
                    experience: typeof data.experience === "number"
                        ? String(data.experience)
                        : data.experience || "",
                    profile_image_url: data.profile_image_url || "",
                });
            } catch (error: any) {
                toast.error(error.message || t("barberPanel.profile.loadFailed"));
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchProfile();
    }, [authUser, token, authContextLoading, updateUserContext]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditableBarberData(prev => ({ ...prev, [name]: value }));
        if (name === "profile_image_url") setPhotoPreview(value);
    };

    const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        const localPreview = URL.createObjectURL(file);
        setPhotoPreview(localPreview);

        setIsUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append("photo", file);
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/barber/profile/upload-photo`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                }
            );
            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: t("barberPanel.profile.uploadFailed") }));
                throw new Error(err.error || t("barberPanel.profile.uploadFailed"));
            }
            const { url } = await response.json();
            setEditableBarberData(prev => ({ ...prev, profile_image_url: url }));
            setPhotoPreview(url);
            toast.success(t("barberPanel.portfolio.uploadSuccess"));
        } catch (error: any) {
            toast.error(error.message || t("barberPanel.profile.uploadFailed"));
            setPhotoPreview(profile?.profile_image_url || "");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!token || !profile) {
            toast.error(t("barberPanel.authError"));
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
                const errorData = await response.json().catch(() => ({ error: t("barberPanel.profile.updateFailed") }));
                throw new Error(errorData.error || t("barberPanel.profile.updateFailed"));
            }
            const updatedProfile: BarberProfileData = await response.json();
            setProfile(updatedProfile);
            setPhotoPreview(updatedProfile.profile_image_url || "");
            setEditableBarberData({
                bio: updatedProfile.bio || "",
                address: updatedProfile.address || "",
                working_hours: updatedProfile.working_hours || "",
                instagram: updatedProfile.instagram || "",
                facebook: updatedProfile.facebook || "",
                specialties: Array.isArray(updatedProfile.specialties)
                    ? updatedProfile.specialties.join(", ")
                    : updatedProfile.specialties || "",
                experience: typeof updatedProfile.experience === "number"
                    ? String(updatedProfile.experience)
                    : updatedProfile.experience || "",
                profile_image_url: updatedProfile.profile_image_url || "",
            });
            setIsEditing(false);
            toast.success(t("barberPanel.profile.updated"));
        } catch (error: any) {
            toast.error(error.message || t("barberPanel.profile.updateFailed"));
        }
    };

    const handleCancel = () => {
        if (profile) {
            setPhotoPreview(profile.profile_image_url || "");
            setEditableBarberData({
                bio: profile.bio || "",
                address: profile.address || "",
                working_hours: profile.working_hours || "",
                instagram: profile.instagram || "",
                facebook: profile.facebook || "",
                specialties: Array.isArray(profile.specialties)
                    ? profile.specialties.join(", ")
                    : profile.specialties || "",
                experience: typeof profile.experience === "number"
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
                <p className="text-red-500">{t("barberPanel.profile.loadFailed")}</p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                    <Link to="/barber-dashboard">{t("barberPanel.goToLogin")}</Link>
                </Button>
            </div>
        );
    }

    const displaySpecialties = Array.isArray(profile.specialties)
        ? profile.specialties
        : typeof profile.specialties === "string" && profile.specialties.length > 0
            ? profile.specialties.split(",").map(s => s.trim())
            : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — profile card */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center">
                                <User className="h-5 w-5 mr-2 text-barber" />
                                {t("barberPanel.profile.viewProfile")}
                            </div>
                            {!isEditing && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit className="h-4 w-4 mr-1" />
                                    {t("barberPanel.profile.editProfile")}
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center text-center">
                            {/* Avatar with upload overlay in edit mode */}
                            <div className="relative mb-4">
                                <Avatar className="h-24 w-24 border-2 border-barber">
                                    <AvatarImage
                                        src={photoPreview || profile.profile_image_url}
                                        alt={`${profile.firstName} ${profile.lastName}`}
                                    />
                                    <AvatarFallback className="bg-barber text-white text-3xl">
                                        {profile.firstName?.[0]?.toUpperCase()}
                                        {profile.lastName?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingPhoto}
                                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                        title={t("barberPanel.profile.uploadPhotoHint")}
                                    >
                                        {isUploadingPhoto
                                            ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                                            : <Camera className="h-6 w-6" />}
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoFileChange}
                            />
                            <h3 className="text-2xl font-semibold text-foreground">
                                {profile.firstName} {profile.lastName}
                            </h3>
                            <p className="text-barber">{t("barberPanel.profile.professionalBarber")}</p>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-2">
                            {profile.rating !== undefined && profile.totalReviews !== undefined && (
                                <div className="flex items-center justify-center">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                    <span className="font-medium text-foreground">{profile.rating.toFixed(1)}</span>
                                    <span className="ml-1">({profile.totalReviews} {t("barberPanel.profile.reviews")})</span>
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
                                <h4 className="font-medium text-muted-foreground mb-2 text-sm">
                                    {t("barberPanel.profile.specialization")}:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {displaySpecialties.map((specialty, index) => (
                                        <Badge key={index} variant="secondary" className="bg-barber/10 text-barber">
                                            {specialty}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {profile.bio && !isEditing && (
                            <div>
                                <h4 className="font-medium text-muted-foreground mb-1 text-sm">
                                    {t("barberPanel.profile.bio")}:
                                </h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{profile.bio}</p>
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
                                    {t("barberPanel.profile.facebook")}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right column — detail / edit form */}
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>
                                {isEditing
                                    ? t("barberPanel.profile.editProfile")
                                    : t("barberPanel.profile.profileDetails")}
                            </span>
                            {isEditing && (
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                        <X className="h-4 w-4 mr-1" />
                                        {t("barberPanel.profile.cancel")}
                                    </Button>
                                    <Button size="sm" onClick={handleSave} className="bg-barber hover:bg-barber-muted">
                                        <Save className="h-4 w-4 mr-1" />
                                        {t("barberPanel.profile.save")}
                                    </Button>
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Account info (read-only) */}
                        <div className="border-b pb-4 mb-4">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                                {t("barberPanel.profile.accountInfo")}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground text-xs">{t("barberPanel.profile.firstName")} &amp; {t("barberPanel.profile.lastName")}</p>
                                        <p className="text-foreground font-medium">{profile.firstName} {profile.lastName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground text-xs">{t("barberPanel.profile.email")}</p>
                                        <p className="text-foreground font-medium">{profile.user_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground text-xs">{t("barberPanel.profile.phone")}</p>
                                        <p className="text-foreground font-medium">{profile.user_phone || "—"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editable barber data */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                                {isEditing
                                    ? t("barberPanel.profile.barberDataEditable")
                                    : t("barberPanel.profile.barberData")}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                                {/* Bio */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="bio">{t("barberPanel.profile.aboutMe")}</Label>
                                    {isEditing ? (
                                        <Textarea
                                            id="bio"
                                            name="bio"
                                            value={editableBarberData.bio}
                                            onChange={handleInputChange}
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground bg-muted p-3 rounded-md whitespace-pre-line min-h-[80px]">
                                            {profile.bio || "—"}
                                        </p>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="address">{t("barberPanel.profile.address")}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="address"
                                            name="address"
                                            value={editableBarberData.address}
                                            onChange={handleInputChange}
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground min-h-[40px] flex items-center">
                                            {profile.address || "—"}
                                        </p>
                                    )}
                                </div>

                                {/* Working hours */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="working_hours">{t("barberPanel.profile.workingHours")}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="working_hours"
                                            name="working_hours"
                                            value={editableBarberData.working_hours}
                                            onChange={handleInputChange}
                                            placeholder={t("barberPanel.profile.workingHoursPlaceholder")}
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground min-h-[40px] flex items-center">
                                            {profile.working_hours || "—"}
                                        </p>
                                    )}
                                </div>

                                {/* Experience */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="experience">{t("barberPanel.profile.experience")}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="experience"
                                            name="experience"
                                            value={editableBarberData.experience}
                                            onChange={handleInputChange}
                                            placeholder={t("barberPanel.profile.experiencePlaceholder")}
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground min-h-[40px] flex items-center">
                                            {profile.experience || "—"}
                                        </p>
                                    )}
                                </div>

                                {/* Specialties */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="specialties">{t("barberPanel.profile.specialization")}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="specialties"
                                            name="specialties"
                                            value={editableBarberData.specialties}
                                            onChange={handleInputChange}
                                            placeholder={t("barberPanel.profile.specializationPlaceholder")}
                                        />
                                    ) : displaySpecialties.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-1 min-h-[40px] items-center">
                                            {displaySpecialties.map((s, i) => (
                                                <Badge key={i} variant="outline">{s}</Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-foreground min-h-[40px] flex items-center">—</p>
                                    )}
                                </div>

                                {/* Profile photo */}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>{t("barberPanel.profile.uploadPhoto")}</Label>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingPhoto}
                                                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-barber hover:text-barber transition-colors w-full justify-center"
                                            >
                                                {isUploadingPhoto
                                                    ? <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-barber" /> Przesyłanie...</>
                                                    : <><Upload className="h-4 w-4" /> {t("barberPanel.profile.uploadPhotoHint")}</>}
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-px bg-border" />
                                                <span className="text-xs text-muted-foreground">{t("barberPanel.profile.photoUrlLabel")}</span>
                                                <div className="flex-1 h-px bg-border" />
                                            </div>
                                            <Input
                                                name="profile_image_url"
                                                value={editableBarberData.profile_image_url}
                                                onChange={handleInputChange}
                                                placeholder={t("barberPanel.profile.photoPlaceholder")}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-foreground truncate min-h-[40px] flex items-center">
                                            {profile.profile_image_url || "—"}
                                        </p>
                                    )}
                                </div>

                                {/* Instagram */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="instagram">{t("barberPanel.profile.instagram")}</Label>
                                    {isEditing ? (
                                        <div className="flex items-center">
                                            <Instagram className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <Input
                                                id="instagram"
                                                name="instagram"
                                                value={editableBarberData.instagram}
                                                onChange={handleInputChange}
                                                placeholder={t("barberPanel.profile.instagramPlaceholder")}
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
                                        <p className="text-sm text-foreground min-h-[40px] flex items-center">—</p>
                                    )}
                                </div>

                                {/* Facebook */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="facebook">{t("barberPanel.profile.facebook")}</Label>
                                    {isEditing ? (
                                        <div className="flex items-center">
                                            <Facebook className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <Input
                                                id="facebook"
                                                name="facebook"
                                                value={editableBarberData.facebook}
                                                onChange={handleInputChange}
                                                placeholder={t("barberPanel.profile.facebookPlaceholder")}
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
                                            {t("barberPanel.profile.facebook")}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-foreground min-h-[40px] flex items-center">—</p>
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
