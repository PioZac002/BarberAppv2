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
import { useLanguage } from "@/contexts/LanguageContext";

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
}

const UserProfile = () => {
    const { user: authUser, token, loading: authContextLoading, updateUserContext } = useAuth();
    useRequireAuth({ allowedRoles: ["client"] });
    const { t } = useLanguage();

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
            toast.error(t("userPanel.profile.loadFailed"));
            return;
        }

        const fetchProfile = async () => {
            setIsDataLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    let errorMsg = t("userPanel.profile.loadFailed");
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
                toast.error(error.message || t("userPanel.profile.loadFailed"));
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
            toast.error(t("userPanel.profile.authError"));
            return;
        }
        if (!profileData.firstName || !profileData.lastName || !profileData.email) {
            toast.error(t("userPanel.profile.required"));
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
                let errorMsg = t("userPanel.profile.updateFailed");
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
            toast.success(t("userPanel.profile.updated"));

            if (updateUserContext && authUser) {
                updateUserContext({
                    id: authUser.id,
                    firstName: newProfileData.firstName,
                    lastName: newProfileData.lastName,
                    email: newProfileData.email,
                });
            }
        } catch (error: any) {
            toast.error(error.message || t("userPanel.profile.updateFailed"));
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
                <p className="text-red-500">{t("userPanel.authErrorDesc")}</p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                    <Link to="/login">{t("userPanel.goToLogin")}</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t("userPanel.profile.personalInfo")}</CardTitle>
                    {!isEditing ? (
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="bg-barber hover:bg-barber-muted"
                        >
                            <Edit className="h-4 w-4 mr-1.5" />
                            {t("userPanel.profile.editProfile")}
                        </Button>
                    ) : (
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleSave}
                                className="bg-barber hover:bg-barber-muted"
                            >
                                <Save className="h-4 w-4 mr-1.5" />
                                {t("userPanel.profile.save")}
                            </Button>
                            <Button variant="outline" onClick={handleCancel}>
                                <XCircle className="h-4 w-4 mr-1.5" />
                                {t("userPanel.profile.cancel")}
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="firstName">{t("userPanel.profile.firstName")}</Label>
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={profileData.firstName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? "bg-muted cursor-not-allowed border-none" : ""}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lastName">{t("userPanel.profile.lastName")}</Label>
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={profileData.lastName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={!isEditing ? "bg-muted cursor-not-allowed border-none" : ""}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email">{t("userPanel.profile.email")}</Label>
                        <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={profileData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-muted cursor-not-allowed border-none" : ""}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="phone">{t("userPanel.profile.phone")}</Label>
                        <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <Input
                                id="phone"
                                name="phone"
                                value={profileData.phone || ""}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder={isEditing ? t("userPanel.profile.enterPhone") : t("userPanel.profile.noValue")}
                                className={!isEditing ? "bg-muted cursor-not-allowed border-none" : ""}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserProfile;
