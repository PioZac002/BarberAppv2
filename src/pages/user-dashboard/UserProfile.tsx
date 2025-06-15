import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Save, Edit, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
}

const UserProfile = () => {
    const { user: authUser, token, loading: authContextLoading, updateUserContext } = useAuth();
    // useRequireAuth głównie do ochrony trasy
    useRequireAuth({ allowedRoles: ["client"] });

    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
    });
    const [initialProfileData, setInitialProfileData] = useState<ProfileData | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (authContextLoading) {
            setIsDataLoading(true);
            return;
        }

        if (!authUser || !token) {
            setIsDataLoading(false);
            setProfileData({ firstName: "", lastName: "", email: "", phone: "" });
            setInitialProfileData(null);
            toast.error("User not authenticated. Cannot load profile.");
            return;
        }

        const fetchProfile = async () => {
            setIsDataLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    let errorMsg = "Failed to fetch profile";
                    try{ const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) {/*ignore*/}
                    throw new Error(errorMsg);
                }
                const data = await response.json();
                const fetchedData = {
                    firstName: data.firstName || authUser.firstName || "",
                    lastName: data.lastName || authUser.lastName || "",
                    email: data.email || authUser.email || "",
                    phone: data.phone || "",
                };
                setProfileData(fetchedData);
                setInitialProfileData(fetchedData);
            } catch (error: any) {
                toast.error(error.message || "Failed to load profile data.");
                const fallbackData = {
                    firstName: authUser.firstName || "",
                    lastName: authUser.lastName || "",
                    email: authUser.email || "",
                    phone: authUser.phone || "" // Zakładając, że user z kontekstu może mieć phone
                };
                setProfileData(fallbackData);
                setInitialProfileData(fallbackData);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchProfile();
    }, [authUser, token, authContextLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setProfileData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        if (!token) {
            toast.error("Authentication error. Please log in again.");
            return;
        }
        // Prosta walidacja
        if (!profileData.firstName || !profileData.lastName || !profileData.email) {
            toast.error("First name, last name, and email are required.");
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(profileData),
            });
            if (!response.ok) {
                let errorMsg = "Failed to update profile";
                try{ const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) {/*ignore*/}
                throw new Error(errorMsg);
            }
            const updatedData = await response.json();
            const newProfileData = {
                firstName: updatedData.firstName,
                lastName: updatedData.lastName,
                email: updatedData.email,
                phone: updatedData.phone || "",
            };
            setProfileData(newProfileData);
            setInitialProfileData(newProfileData);
            setIsEditing(false);
            toast.success("Profile updated successfully!");

            if (updateUserContext && authUser) {
                updateUserContext({ // Aktualizuj tylko te pola, które są w User interfejsie AuthContextType
                    id: authUser.id, // Przekaż ID, aby wiedzieć którego usera aktualizować w kontekście
                    firstName: newProfileData.firstName,
                    lastName: newProfileData.lastName,
                    email: newProfileData.email,
                    // phone: newProfileData.phone, // Jeśli User w AuthContextType ma phone
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save profile.");
        }
    };

    const handleCancel = () => {
        if (initialProfileData) {
            setProfileData(initialProfileData);
        }
        setIsEditing(false);
    };

    if (authContextLoading || isDataLoading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    if (!authContextLoading && !authUser) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">User not authenticated. Cannot display profile.</p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted"><Link to="/login">Go to Login</Link></Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <User className="h-5 w-5 mr-2 text-barber" />
                            Profile Picture
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Avatar className="w-32 h-32 mx-auto mb-4 border-2 border-barber">
                            <AvatarFallback className="bg-barber text-white text-4xl">
                                {profileData.firstName?.[0]?.toUpperCase()}
                                {profileData.lastName?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <Button variant="outline" className="w-full" disabled>
                            Change Photo (soon)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Personal Information</CardTitle>
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="bg-barber hover:bg-barber-muted"
                            >
                                <Edit className="h-4 w-4 mr-1.5" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex space-x-2">
                                <Button
                                    onClick={handleSave}
                                    className="bg-barber hover:bg-barber-muted"
                                >
                                    <Save className="h-4 w-4 mr-1.5" />
                                    Save
                                </Button>
                                <Button variant="outline" onClick={handleCancel}>
                                    <XCircle className="h-4 w-4 mr-1.5" />
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="firstName">First Name</Label>
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                    <Input
                                        id="firstName"
                                        name="firstName" // Dodane dla spójności
                                        value={profileData.firstName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={!isEditing ? "bg-gray-100 cursor-not-allowed border-none text-gray-700" : ""}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lastName">Last Name</Label>
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={!isEditing ? "bg-gray-100 cursor-not-allowed border-none text-gray-700" : ""}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={profileData.email}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? "bg-gray-100 cursor-not-allowed border-none text-gray-700" : ""}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={profileData.phone || ""}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    placeholder={isEditing ? "Enter phone number" : "Not provided"}
                                    className={!isEditing ? "bg-gray-100 cursor-not-allowed border-none text-gray-700" : ""}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserProfile;