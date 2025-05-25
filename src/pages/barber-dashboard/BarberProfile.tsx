import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Dodano AvatarImage
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
    Briefcase, // Ikona dla Experience
    Sparkles, // Ikona dla Specialties
    Instagram, // Ikona dla Instagram
    Facebook, // Ikona dla Facebook
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge"; // Dla specjalizacji

interface BarberProfileData {
    firstName: string; // z users
    lastName: string;  // z users
    user_email: string; // z users (zmieniono z email na user_email)
    user_phone: string; // z users (zmieniono z phone na user_phone)
    barber_table_id: number; // id z tabeli barbers
    bio?: string;
    address?: string;
    working_hours?: string;
    instagram?: string;
    facebook?: string;
    specialties?: string[] | string; // Może być stringiem z backendu (rozdzielanym przecinkami) lub tablicą
    experience?: string;
    rating?: number;
    totalReviews?: number;
    // avatar_url?: string; // Jeśli barber ma mieć awatar w tabeli barbers
}

const BarberProfile = () => {
    const { user, loading } = useRequireAuth({ allowedRoles: ["barber", "admin"] });
    const [profile, setProfile] = useState<BarberProfileData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    // Pola edytowalne będą tylko z tabeli barbers
    const [editableBarberData, setEditableBarberData] = useState({
        bio: "",
        address: "",
        working_hours: "",
        instagram: "",
        facebook: "",
        specialties: "", // Będziemy edytować jako string rozdzielany przecinkami
        experience: "",
    });

    useEffect(() => {
        if (!user || loading) return;

        const fetchProfile = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/barber/profile", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (!response.ok) throw new Error("Failed to fetch profile");
                const data: BarberProfileData = await response.json();
                setProfile(data);
                // Ustaw dane edytowalne
                setEditableBarberData({
                    bio: data.bio || "",
                    address: data.address || "",
                    working_hours: data.working_hours || "",
                    instagram: data.instagram || "",
                    facebook: data.facebook || "",
                    specialties: Array.isArray(data.specialties) ? data.specialties.join(', ') : (data.specialties || ""),
                    experience: data.experience || "",
                });
            } catch (error) {
                console.error(error);
                toast.error("Failed to load profile");
            }
        };

        fetchProfile();
    }, [user, loading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditableBarberData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            // Przygotuj dane do wysłania (specialties jako string, jeśli tak przechowujesz)
            const payload = {
                ...editableBarberData,
                // Jeśli backend oczekuje tablicy dla TEXT[]:
                // specialties: editableBarberData.specialties.split(',').map(s => s.trim()).filter(s => s),
            };

            const response = await fetch("http://localhost:3000/api/barber/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update profile");
            }
            const updatedProfile: BarberProfileData = await response.json();
            setProfile(updatedProfile);
            // Zaktualizuj stan edytowalny, na wypadek gdyby backend coś zmodyfikował (np. sformatował)
            setEditableBarberData({
                bio: updatedProfile.bio || "",
                address: updatedProfile.address || "",
                working_hours: updatedProfile.working_hours || "",
                instagram: updatedProfile.instagram || "",
                facebook: updatedProfile.facebook || "",
                specialties: Array.isArray(updatedProfile.specialties) ? updatedProfile.specialties.join(', ') : (updatedProfile.specialties || ""),
                experience: updatedProfile.experience || "",
            });
            setIsEditing(false);
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to update profile");
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
                specialties: Array.isArray(profile.specialties) ? profile.specialties.join(', ') : (profile.specialties || ""),
                experience: profile.experience || "",
            });
        }
        setIsEditing(false);
    };

    if (loading || !profile) {
        return (
            <DashboardLayout title="My Profile">
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
                </div>
            </DashboardLayout>
        );
    }

    const displaySpecialties = Array.isArray(profile.specialties)
        ? profile.specialties
        : (typeof profile.specialties === 'string' && profile.specialties.length > 0
            ? profile.specialties.split(',').map(s => s.trim())
            : []);


    return (
        <DashboardLayout title="My Profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolumna lewa - Podgląd profilu */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <User className="h-5 w-5 mr-2 text-barber" />
                                    Profile Overview
                                </div>
                                {!isEditing && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit Details
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 mb-4 border-2 border-barber">
                                    {/* <AvatarImage src={profile.avatar_url} alt={`${profile.firstName} ${profile.lastName}`} /> */}
                                    <AvatarFallback className="bg-barber text-white text-3xl">
                                        {profile.firstName?.[0]?.toUpperCase()}
                                        {profile.lastName?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <h3 className="text-2xl font-semibold text-gray-800">
                                    {profile.firstName} {profile.lastName}
                                </h3>
                                <p className="text-barber">Professional Barber</p>
                            </div>

                            <div className="text-sm text-gray-600 space-y-2">
                                {profile.rating !== undefined && profile.totalReviews !== undefined && (
                                    <div className="flex items-center justify-center">
                                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                        <span className="font-medium text-gray-700">{profile.rating.toFixed(1)}</span>
                                        <span className="ml-1">({profile.totalReviews} reviews)</span>
                                    </div>
                                )}
                                {profile.address && (
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span>{profile.address}</span>
                                    </div>
                                )}
                                {profile.working_hours && (
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span>{profile.working_hours}</span>
                                    </div>
                                )}
                                {profile.experience && (
                                    <div className="flex items-center">
                                        <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span>{profile.experience}</span>
                                    </div>
                                )}
                            </div>

                            {displaySpecialties.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2 text-sm">Specialties:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {displaySpecialties.map((specialty, index) => (
                                            <Badge key={index} variant="secondary" className="bg-barber/10 text-barber">
                                                {specialty}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {profile.bio && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-1 text-sm">Bio:</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{profile.bio}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Kolumna prawa - Szczegóły i edycja */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                {isEditing ? "Edit Profile Details" : "Profile Details"}
                                {isEditing && (
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSave}
                                            className="bg-barber hover:bg-barber-muted"
                                        >
                                            <Save className="h-4 w-4 mr-1" />
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Sekcja Danych Użytkownika (nieedytowalne) */}
                            <div className="border-b pb-4 mb-4">
                                <h4 className="text-md font-semibold text-gray-700 mb-3">Account Information (Read-only)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                    <div className="flex items-center">
                                        <User className="h-4 w-4 mr-2 text-gray-400" />
                                        <div>
                                            <p className="text-gray-500">Full Name</p>
                                            <p className="text-gray-800">{profile.firstName} {profile.lastName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                        <div>
                                            <p className="text-gray-500">Email</p>
                                            <p className="text-gray-800">{profile.user_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                        <div>
                                            <p className="text-gray-500">Phone</p>
                                            <p className="text-gray-800">{profile.user_phone || "Not provided"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sekcja Danych Barbera (edytowalne) */}
                            <div>
                                <h4 className="text-md font-semibold text-gray-700 mb-3">Barber Details {isEditing && "(Editable)"}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="space-y-1 md:col-span-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        {isEditing ? (
                                            <Textarea id="bio" name="bio" value={editableBarberData.bio} onChange={handleInputChange} rows={4} />
                                        ) : (
                                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-line">{profile.bio || "No bio provided."}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <Label htmlFor="address">Address</Label>
                                        {isEditing ? (
                                            <Input id="address" name="address" value={editableBarberData.address} onChange={handleInputChange} />
                                        ) : (
                                            <p className="text-sm text-gray-700">{profile.address || "Not provided"}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="working_hours">Working Hours</Label>
                                        {isEditing ? (
                                            <Input id="working_hours" name="working_hours" value={editableBarberData.working_hours} onChange={handleInputChange} placeholder="e.g., Mon-Fri 9am-5pm"/>
                                        ) : (
                                            <p className="text-sm text-gray-700">{profile.working_hours || "Not specified"}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="experience">Experience</Label>
                                        {isEditing ? (
                                            <Input id="experience" name="experience" value={editableBarberData.experience} onChange={handleInputChange} placeholder="e.g., 5 years as a barber"/>
                                        ) : (
                                            <p className="text-sm text-gray-700">{profile.experience || "Not specified"}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                                        {isEditing ? (
                                            <Input id="specialties" name="specialties" value={editableBarberData.specialties} onChange={handleInputChange} placeholder="e.g., Fades, Beard Trims, Hot Towel Shaves"/>
                                        ) : (
                                            displaySpecialties.length > 0 ? (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {displaySpecialties.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                                                </div>
                                            ) : <p className="text-sm text-gray-700">No specialties listed.</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="instagram">Instagram Username</Label>
                                        {isEditing ? (
                                            <div className="flex items-center">
                                                <Instagram className="h-4 w-4 mr-2 text-gray-400"/>
                                                <Input id="instagram" name="instagram" value={editableBarberData.instagram} onChange={handleInputChange} placeholder="your_instagram"/>
                                            </div>
                                        ) : (
                                            profile.instagram ? <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center"><Instagram className="h-4 w-4 mr-1"/>@{profile.instagram}</a> : <p className="text-sm text-gray-700">Not provided</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="facebook">Facebook Profile URL</Label>
                                        {isEditing ? (
                                            <div className="flex items-center">
                                                <Facebook className="h-4 w-4 mr-2 text-gray-400"/>
                                                <Input id="facebook" name="facebook" value={editableBarberData.facebook} onChange={handleInputChange} placeholder="https://facebook.com/yourprofile"/>
                                            </div>
                                        ) : (
                                            profile.facebook ? <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center"><Facebook className="h-4 w-4 mr-1"/>View Profile</a> : <p className="text-sm text-gray-700">Not provided</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BarberProfile;