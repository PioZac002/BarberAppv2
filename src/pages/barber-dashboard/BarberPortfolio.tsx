// src/pages/barber-dashboard/BarberPortfolio.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Image as ImageIcon,
    Plus,
    Trash2,
    Link as LinkIcon,
    Upload,
    Clipboard,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link as RouterLink } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface PortfolioImage {
    id: number;
    image_url: string;
    title: string;
    description: string;
    created_at: string;
}

const placeholderSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e9ecef'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16px' fill='%236c757d'%3EObrazek%20niedost%C4%99pny%3C/text%3E%3C/svg%3E";

const BarberPortfolioPage = () => {
    const { user: authUser, token, loading: authContextLoading } = useAuth();
    const { t, lang } = useLanguage();

    const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<PortfolioImage | null>(null);
    const [addTab, setAddTab] = useState("url");
    const [isUploading, setIsUploading] = useState(false);

    // Form fields
    const [newImageUrl, setNewImageUrl] = useState("");
    const [newImageTitle, setNewImageTitle] = useState("");
    const [newImageDescription, setNewImageDescription] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pasteAreaRef = useRef<HTMLDivElement>(null);

    // ── Fetch portfolio ──
    useEffect(() => {
        if (authContextLoading) { setIsLoading(true); return; }
        if (!authUser || !token) {
            setIsLoading(false);
            setPortfolioImages([]);
            return;
        }
        const fetchPortfolio = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/portfolio`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: t("barberPanel.portfolio.loadFailed") }));
                    throw new Error(err.error || t("barberPanel.portfolio.loadFailed"));
                }
                const data: PortfolioImage[] = await res.json();
                data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setPortfolioImages(data);
            } catch (error: any) {
                toast.error(error.message || t("barberPanel.portfolio.loadFailed"));
            } finally {
                setIsLoading(false);
            }
        };
        fetchPortfolio();
    }, [authUser, token, authContextLoading]);

    // ── Clipboard paste handler ──
    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        if (!isAddModalOpen || addTab !== "paste") return;
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) return;
                const objectUrl = URL.createObjectURL(file);
                setPreviewUrl(objectUrl);
                await uploadFile(file);
                return;
            }
        }
    }, [isAddModalOpen, addTab, token]);

    useEffect(() => {
        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [handlePaste]);

    const resetForm = () => {
        setNewImageUrl("");
        setNewImageTitle("");
        setNewImageDescription("");
        setPreviewUrl("");
        setAddTab("url");
    };

    // ── Upload file to backend ──
    const uploadFile = async (file: File): Promise<string | null> => {
        if (!token) return null;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/portfolio/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: t("barberPanel.portfolio.uploadFailed") }));
                throw new Error(err.error || t("barberPanel.portfolio.uploadFailed"));
            }
            const { url } = await res.json();
            setNewImageUrl(url);
            setPreviewUrl(url);
            toast.success(t("barberPanel.portfolio.uploadSuccess"));
            return url;
        } catch (error: any) {
            toast.error(error.message || t("barberPanel.portfolio.uploadFailed"));
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        await uploadFile(file);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        await uploadFile(file);
    };

    // ── Add portfolio entry ──
    const handleAddImage = async () => {
        const urlToUse = addTab === "url" ? newImageUrl : newImageUrl;
        if (!urlToUse) {
            toast.error(t("barberPanel.portfolio.urlRequired"));
            return;
        }
        if (!token) { toast.error(t("barberPanel.portfolio.authError")); return; }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/barber/portfolio`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    image_url: urlToUse,
                    title: newImageTitle || (lang === "pl" ? "Bez tytułu" : "Untitled"),
                    description: newImageDescription || "",
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: t("barberPanel.portfolio.addFailed") }));
                throw new Error(err.error || t("barberPanel.portfolio.addFailed"));
            }
            const addedImage: PortfolioImage = await res.json();
            setPortfolioImages(prev =>
                [addedImage, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            );
            resetForm();
            setIsAddModalOpen(false);
            toast.success(t("barberPanel.portfolio.added"));
        } catch (error: any) {
            toast.error(error.message || t("barberPanel.portfolio.addFailed"));
        }
    };

    const openDeleteModal = (image: PortfolioImage) => {
        setImageToDelete(image);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!imageToDelete || !token) return;
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/barber/portfolio/${imageToDelete.id}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: t("barberPanel.portfolio.deleteFailed") }));
                throw new Error(err.error || t("barberPanel.portfolio.deleteFailed"));
            }
            setPortfolioImages(portfolioImages.filter(img => img.id !== imageToDelete.id));
            setIsDeleteModalOpen(false);
            setImageToDelete(null);
            toast.success(t("barberPanel.portfolio.deleted"));
        } catch (error: any) {
            toast.error(error.message || t("barberPanel.portfolio.deleteFailed"));
        }
    };

    if (authContextLoading || isLoading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber" />
            </div>
        );
    }

    if (!authContextLoading && !authUser) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">{t("barberPanel.authError")}</p>
                <Button asChild className="mt-4 bg-barber hover:bg-barber-muted">
                    <RouterLink to="/login">{t("barberPanel.goToLogin")}</RouterLink>
                </Button>
            </div>
        );
    }

    const currentPreview = addTab === "url" ? newImageUrl : previewUrl;

    return (
        <>
            <Card className="mb-6 shadow-md">
                <CardHeader className="border-b pb-4">
                    <CardTitle className="flex items-center justify-between text-xl sm:text-2xl">
                        <div className="flex items-center">
                            <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-barber" />
                            {t("barberPanel.portfolio.title")}
                        </div>
                        <Button
                            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                            className="bg-barber hover:bg-barber-muted text-xs sm:text-sm h-9 sm:h-10"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            {t("barberPanel.portfolio.addNew")}
                        </Button>
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs md:text-sm">
                        {t("barberPanel.portfolio.subtitle")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                    {portfolioImages.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {portfolioImages.map(image => (
                                <div
                                    key={image.id}
                                    className="group relative rounded-lg overflow-hidden shadow-lg aspect-square"
                                >
                                    <img
                                        src={image.image_url}
                                        alt={image.title || "Portfolio"}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        onError={e => { (e.target as HTMLImageElement).src = placeholderSvg; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3 sm:p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <h3 className="font-semibold text-md sm:text-lg text-white truncate">{image.title}</h3>
                                        {image.description && (
                                            <p className="text-xs sm:text-sm text-gray-200 line-clamp-2">{image.description}</p>
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-red-600/80 hover:bg-red-600"
                                            onClick={e => { e.stopPropagation(); openDeleteModal(image); }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto bg-muted rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-1">{t("barberPanel.portfolio.empty")}</h3>
                            <p className="text-muted-foreground mb-4">{t("barberPanel.portfolio.emptyDesc")}</p>
                            <Button
                                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                                className="bg-barber hover:bg-barber-muted"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                {t("barberPanel.portfolio.addFirst")}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add image dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={open => { if (!open) resetForm(); setIsAddModalOpen(open); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t("barberPanel.portfolio.addDialog")}</DialogTitle>
                        <DialogDescription>{t("barberPanel.portfolio.addDialogDesc")}</DialogDescription>
                    </DialogHeader>

                    <Tabs value={addTab} onValueChange={tab => { setAddTab(tab); setPreviewUrl(""); setNewImageUrl(""); }}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="url" className="text-xs sm:text-sm">
                                <LinkIcon className="h-3.5 w-3.5 mr-1" />
                                {t("barberPanel.portfolio.urlTab")}
                            </TabsTrigger>
                            <TabsTrigger value="upload" className="text-xs sm:text-sm">
                                <Upload className="h-3.5 w-3.5 mr-1" />
                                {t("barberPanel.portfolio.uploadTab")}
                            </TabsTrigger>
                            <TabsTrigger value="paste" className="text-xs sm:text-sm">
                                <Clipboard className="h-3.5 w-3.5 mr-1" />
                                {t("barberPanel.portfolio.pasteTab")}
                            </TabsTrigger>
                        </TabsList>

                        {/* URL tab */}
                        <TabsContent value="url" className="space-y-3 mt-3">
                            <div className="space-y-1">
                                <Label htmlFor="newImageUrl">
                                    {t("barberPanel.portfolio.imageUrl")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="newImageUrl"
                                    value={newImageUrl}
                                    onChange={e => setNewImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            {newImageUrl && (
                                <div className="border rounded-lg overflow-hidden h-40">
                                    <img
                                        src={newImageUrl}
                                        alt={t("barberPanel.portfolio.preview")}
                                        className="w-full h-full object-contain"
                                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                </div>
                            )}
                        </TabsContent>

                        {/* Upload tab */}
                        <TabsContent value="upload" className="space-y-3 mt-3">
                            <div
                                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-barber hover:bg-barber/5 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-barber" />
                                        <p className="text-sm">Przesyłanie...</p>
                                    </div>
                                ) : previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="preview"
                                        className="max-h-36 mx-auto rounded object-contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-8 w-8 text-barber" />
                                        <p className="text-sm font-medium">{t("barberPanel.portfolio.clickToUpload")}</p>
                                        <p className="text-xs">JPG, PNG, WEBP</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileInputChange}
                            />
                        </TabsContent>

                        {/* Paste tab */}
                        <TabsContent value="paste" className="space-y-3 mt-3">
                            <div
                                ref={pasteAreaRef}
                                className="border-2 border-dashed border-border rounded-lg p-6 text-center focus:outline-none focus:border-barber transition-colors"
                                tabIndex={0}
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-barber" />
                                        <p className="text-sm">Przesyłanie...</p>
                                    </div>
                                ) : previewUrl ? (
                                    <div className="space-y-2">
                                        <img
                                            src={previewUrl}
                                            alt="paste preview"
                                            className="max-h-36 mx-auto rounded object-contain"
                                        />
                                        <p className="text-xs text-green-600 font-medium">{t("barberPanel.portfolio.pasteReady")}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Clipboard className="h-8 w-8 text-barber" />
                                        <p className="text-sm font-medium">{t("barberPanel.portfolio.pasteHint")}</p>
                                        <p className="text-xs">Ctrl+V / Cmd+V</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Common title/desc fields */}
                    <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                            <Label htmlFor="newImageTitle">{t("barberPanel.portfolio.titleLabel")}</Label>
                            <Input
                                id="newImageTitle"
                                value={newImageTitle}
                                onChange={e => setNewImageTitle(e.target.value)}
                                placeholder={t("barberPanel.portfolio.titlePlaceholder")}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="newImageDescription">{t("barberPanel.portfolio.descLabel")}</Label>
                            <Textarea
                                id="newImageDescription"
                                value={newImageDescription}
                                onChange={e => setNewImageDescription(e.target.value)}
                                placeholder={t("barberPanel.portfolio.descPlaceholder")}
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{t("barberPanel.portfolio.cancel")}</Button>
                        </DialogClose>
                        <Button
                            className="bg-barber hover:bg-barber-muted"
                            onClick={handleAddImage}
                            disabled={!newImageUrl || isUploading}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {t("barberPanel.portfolio.addButton")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("barberPanel.portfolio.deleteDialog")}</DialogTitle>
                        <DialogDescription>{t("barberPanel.portfolio.deleteConfirm")}</DialogDescription>
                    </DialogHeader>
                    {imageToDelete && (
                        <div className="border rounded-md p-2 my-4 max-h-48 overflow-hidden">
                            <img
                                src={imageToDelete.image_url}
                                alt={imageToDelete.title || "Image"}
                                className="w-full h-auto object-contain rounded max-h-44"
                                onError={e => { (e.target as HTMLImageElement).src = placeholderSvg; }}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{t("barberPanel.portfolio.cancel")}</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("barberPanel.portfolio.deleteButton")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default BarberPortfolioPage;
