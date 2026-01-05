import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Save, Edit, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
}

const UserProfile = () => {
    const { user: authUser, token, loading: authContextLoading, updateUserContext } = useAuth();
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
            toast.error("Nie udało się uwierzytelnić użytkownika. Nie można wczytać profilu.");
            return;
        }

        const fetchProfile = async () => {
            setIsDataLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    let errorMsg = "Nie udało się pobrać profilu";
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) {/*ignore*/}
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
                toast.error(error.message || "Nie udało się wczytać danych profilu.");
                const fallbackData = {
                    firstName: authUser.firstName || "",
                    lastName: authUser.lastName || "",
                    email: authUser.email || "",
                    phone: authUser.phone || "",
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
            toast.error("Błąd uwierzytelniania. Zaloguj się ponownie.");
            return;
        }
        if (!profileData.firstName || !profileData.lastName || !profileData.email) {
            toast.error("Imię, nazwisko i adres e-mail są wymagane.");
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
                let errorMsg = "Nie udało się zaktualizować profilu";
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {/*ignore*/}
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
            toast.success("Profil został pomyślnie zaktualizowany!");

            if (updateUserContext && authUser) {
                updateUserContext({
                    id: authUser.id,
                    firstName: newProfileData.firstName,
                    lastName: newProfileData.lastName,
                    email: newProfileData.email,
                    // phone: newProfileData.phone, // jeśli jest w typie User
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Nie udało się zapisać profilu.");
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
                <p className="text-red-500">Nie udało się uwierzytelnić użytkownika. Nie można wyświetlić profilu.</p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                    <Link to="/login">Przejdź do logowania</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Dane osobowe</CardTitle>
                    {!isEditing ? (
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="bg-barber hover:bg-barber-muted"
                        >
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edytuj profil
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleSave}
                                className="bg-barber hover:bg-barber-muted"
                            >
                                <Save className="h-4 w-4 mr-1.5" />
                                Zapisz
                            </Button>
                            <Button variant="outline" onClick={handleCancel}>
                                <XCircle className="h-4 w-4 mr-1.5" />
                                Anuluj
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="firstName">Imię</Label>
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={profileData.firstName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={
                                        !isEditing
                                            ? "bg-gray-100 cursor-not-allowed border-none text-gray-700"
                                            : ""
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lastName">Nazwisko</Label>
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={profileData.lastName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={
                                        !isEditing
                                            ? "bg-gray-100 cursor-not-allowed border-none text-gray-700"
                                            : ""
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email">E-mail</Label>
                        <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={profileData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={
                                    !isEditing
                                        ? "bg-gray-100 cursor-not-allowed border-none text-gray-700"
                                        : ""
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="phone">Numer telefonu</Label>
                        <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <Input
                                id="phone"
                                name="phone"
                                value={profileData.phone || ""}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder={
                                    isEditing
                                        ? "Wprowadź numer telefonu"
                                        : "Brak"
                                }
                                className={
                                    !isEditing
                                        ? "bg-gray-100 cursor-not-allowed border-none text-gray-700"
                                        : ""
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserProfile;
