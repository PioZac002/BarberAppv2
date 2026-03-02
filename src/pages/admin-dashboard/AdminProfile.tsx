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

const AdminProfile = () => {
    const { user: authUser, token, loading: authContextLoading, updateUserContext } = useAuth();
    useRequireAuth({ allowedRoles: ["admin"] });

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
        if (authContextLoading) { setIsDataLoading(true); return; }
        if (!authUser || !token) {
            setIsDataLoading(false);
            toast.error("Nie udało się uwierzytelnić użytkownika.");
            return;
        }

        const fetchProfile = async () => {
            setIsDataLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Nie udało się pobrać profilu");
                const data = await response.json();
                const fetched = {
                    firstName: data.firstName || authUser.firstName || "",
                    lastName: data.lastName || authUser.lastName || "",
                    email: data.email || authUser.email || "",
                    phone: data.phone || "",
                };
                setProfileData(fetched);
                setInitialProfileData(fetched);
            } catch (error: any) {
                toast.error(error.message || "Nie udało się wczytać danych profilu.");
                const fallback = {
                    firstName: authUser.firstName || "",
                    lastName: authUser.lastName || "",
                    email: authUser.email || "",
                    phone: authUser.phone || "",
                };
                setProfileData(fallback);
                setInitialProfileData(fallback);
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
        if (!token) { toast.error("Błąd uwierzytelniania."); return; }
        if (!profileData.firstName || !profileData.lastName || !profileData.email) {
            toast.error("Imię, nazwisko i e-mail są wymagane.");
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(profileData),
            });
            if (!response.ok) throw new Error("Nie udało się zaktualizować profilu");
            const updatedData = await response.json();
            const newData = {
                firstName: updatedData.firstName,
                lastName: updatedData.lastName,
                email: updatedData.email,
                phone: updatedData.phone || "",
            };
            setProfileData(newData);
            setInitialProfileData(newData);
            setIsEditing(false);
            toast.success("Profil został zaktualizowany!");
            if (updateUserContext && authUser) {
                updateUserContext({ id: authUser.id, firstName: newData.firstName, lastName: newData.lastName, email: newData.email });
            }
        } catch (error: any) {
            toast.error(error.message || "Nie udało się zapisać profilu.");
        }
    };

    const handleCancel = () => {
        if (initialProfileData) setProfileData(initialProfileData);
        setIsEditing(false);
    };

    if (authContextLoading || isDataLoading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber" />
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">Nie udało się uwierzytelnić użytkownika.</p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                    <Link to="/login">Przejdź do logowania</Link>
                </Button>
            </div>
        );
    }

    const inputDisabledClass = "bg-muted cursor-not-allowed border-none text-muted-foreground";

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Dane osobowe</CardTitle>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} className="bg-barber hover:bg-barber-muted">
                            <Edit className="h-4 w-4 mr-1.5" /> Edytuj profil
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button onClick={handleSave} className="bg-barber hover:bg-barber-muted">
                                <Save className="h-4 w-4 mr-1.5" /> Zapisz
                            </Button>
                            <Button variant="outline" onClick={handleCancel}>
                                <XCircle className="h-4 w-4 mr-1.5" /> Anuluj
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="firstName">Imię</Label>
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input id="firstName" value={profileData.firstName} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? inputDisabledClass : ""} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lastName">Nazwisko</Label>
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input id="lastName" value={profileData.lastName} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? inputDisabledClass : ""} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="email">E-mail</Label>
                        <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <Input id="email" type="email" value={profileData.email} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? inputDisabledClass : ""} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="phone">Numer telefonu</Label>
                        <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <Input id="phone" value={profileData.phone || ""} onChange={handleInputChange} disabled={!isEditing} placeholder={isEditing ? "Wprowadź numer telefonu" : "Brak"} className={!isEditing ? inputDisabledClass : ""} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminProfile;
