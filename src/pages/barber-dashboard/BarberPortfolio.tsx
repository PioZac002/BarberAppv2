import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Image as ImageIcon,
    Plus,
    Trash2,
    Link as LinkIcon,
    Upload,
} from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
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
import { toast } from "sonner";

interface PortfolioImage {
    id: number;
    image_url: string;
    title: string;
    description: string;
}

const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e9ecef'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16px' fill='%236c757d'%3EImage not found%3C/text%3E%3C/svg%3E";

const BarberPortfolio = () => {
    const { user, loading } = useRequireAuth({ allowedRoles: ["barber", "admin"] });
    const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<PortfolioImage | null>(null);

    const [newImageUrl, setNewImageUrl] = useState("");
    const [newImageTitle, setNewImageTitle] = useState("");
    const [newImageDescription, setNewImageDescription] = useState("");

    useEffect(() => {
        if (!user || loading) return;

        const fetchPortfolio = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/barber/portfolio", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (!response.ok) {
                    let errorMsg = "Failed to fetch portfolio";
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) { /* Ignore if response is not JSON */ }
                    throw new Error(errorMsg);
                }
                const data = await response.json();
                setPortfolioImages(data);
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "Failed to load portfolio");
            }
        };

        fetchPortfolio();
    }, [user, loading]);

    const resetAddModalForm = () => {
        setNewImageUrl("");
        setNewImageTitle("");
        setNewImageDescription("");
    };

    const handleAddImage = async () => {
        if (!newImageUrl) {
            toast.error("Image URL is required");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/barber/portfolio", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    image_url: newImageUrl,
                    title: newImageTitle || "Untitled",
                    description: newImageDescription || "",
                }),
            });
            if (!response.ok) {
                let errorMsg = "Failed to add image";
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMsg = errorData.error;
                    } else {
                        errorMsg = `Error: ${response.status} ${response.statusText}`;
                    }
                } catch (e) {
                    errorMsg = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }
            const addedImage = await response.json();
            setPortfolioImages(prevImages => [addedImage, ...prevImages]);
            resetAddModalForm();
            setIsAddModalOpen(false);
            toast.success("Image added to portfolio!");
        } catch (error: any) {
            console.error("Error in handleAddImage:", error);
            toast.error(error.message || "Could not add image to portfolio");
        }
    };

    const openDeleteModal = (image: PortfolioImage) => {
        setImageToDelete(image);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (imageToDelete) {
            try {
                const response = await fetch(`http://localhost:3000/api/barber/portfolio/${imageToDelete.id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (!response.ok) {
                    let errorMsg = "Failed to delete image";
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) { /* Ignore */ }
                    throw new Error(errorMsg);
                }
                setPortfolioImages(portfolioImages.filter(img => img.id !== imageToDelete.id));
                setIsDeleteModalOpen(false);
                setImageToDelete(null);
                toast.success("Image removed from portfolio.");
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "Failed to delete image");
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="My Portfolio">
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="My Portfolio">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                            <ImageIcon className="h-5 w-5 mr-2 text-barber" />
                            Portfolio Gallery
                        </div>
                        <Button
                            onClick={() => {
                                resetAddModalForm();
                                setIsAddModalOpen(true);
                            }}
                            className="bg-barber hover:bg-barber-muted"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add New Image
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {portfolioImages.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {portfolioImages.map((image) => (
                                <div
                                    key={image.id}
                                    className="group relative rounded-lg overflow-hidden shadow-lg aspect-square"
                                >
                                    <img
                                        src={image.image_url}
                                        alt={image.title || 'Portfolio image'}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = placeholderSvg;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                        <h3 className="font-semibold text-lg text-white truncate">{image.title}</h3>
                                        {image.description && <p className="text-sm text-gray-200 line-clamp-2">{image.description}</p>}
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-9 w-9 rounded-full bg-red-600/80 hover:bg-red-600"
                                            onClick={() => openDeleteModal(image)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Your portfolio is empty</h3>
                            <p className="text-gray-500 mb-4">
                                Add photos of your best work to showcase your skills.
                            </p>
                            <Button
                                onClick={() => {
                                    resetAddModalForm();
                                    setIsAddModalOpen(true);
                                }}
                                className="bg-barber hover:bg-barber-muted"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add First Image
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Image Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Portfolio Image</DialogTitle>
                        <DialogDescription>
                            Enter the direct URL of the image, a title, and an optional description.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="newImageUrl">Image URL <span className="text-red-500">*</span></Label>
                            <div className="flex items-center space-x-2">
                                <LinkIcon className="h-4 w-4 text-gray-500" />
                                <Input
                                    id="newImageUrl"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    placeholder="https://example.com/your-image.jpg"
                                />
                            </div>
                        </div>

                        {newImageUrl && (
                            <div className="border rounded-md p-2 max-h-48 overflow-hidden">
                                <img
                                    src={newImageUrl}
                                    alt="Preview"
                                    className="w-full h-auto object-contain rounded max-h-44"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        const parent = (e.target as HTMLImageElement).parentElement;
                                        if (parent && !parent.querySelector('.error-text')) {
                                            const errorText = document.createElement('p');
                                            errorText.className = 'text-red-500 text-xs error-text';
                                            errorText.textContent = 'Invalid image URL or unable to load image.';
                                            parent.appendChild(errorText);
                                        }
                                    }}
                                    onLoad={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'block';
                                        const parent = (e.target as HTMLImageElement).parentElement;
                                        const errorText = parent?.querySelector('.error-text');
                                        if (errorText) parent?.removeChild(errorText);
                                    }}
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label htmlFor="newImageTitle">Title</Label>
                            <Input
                                id="newImageTitle"
                                value={newImageTitle}
                                onChange={(e) => setNewImageTitle(e.target.value)}
                                placeholder="e.g., Classic Fade"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="newImageDescription">Description</Label>
                            <Textarea
                                id="newImageDescription"
                                value={newImageDescription}
                                onChange={(e) => setNewImageDescription(e.target.value)}
                                placeholder="e.g., Clean fade with textured top"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-barber hover:bg-barber-muted"
                            onClick={handleAddImage}
                            disabled={!newImageUrl}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Add to Portfolio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Image</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this image titled "{imageToDelete?.title || 'Untitled'}" from your portfolio? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {imageToDelete && (
                        <div className="border rounded-md p-2 my-4 max-h-48 overflow-hidden">
                            <img
                                src={imageToDelete.image_url}
                                alt={imageToDelete.title || 'Image to delete'}
                                className="w-full h-auto object-contain rounded max-h-44"
                                onError={(e) => { (e.target as HTMLImageElement).src = placeholderSvg; }}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            {/* POPRAWIONA LINIA PONIŻEJ */}
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Image
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default BarberPortfolio;