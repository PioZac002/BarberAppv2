
import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Image,
    Plus,
    X,
    Upload,
    Trash2,
    Link as LinkIcon
} from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Sample portfolio images
const initialImages = [
    {
        id: 1,
        url: "https://images.unsplash.com/photo-1584487862937-4781db1c1e9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        title: "Classic Fade",
        description: "Clean fade with textured top"
    },
    {
        id: 2,
        url: "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1029&q=80",
        title: "Beard Trim",
        description: "Precise beard shaping and styling"
    },
    {
        id: 3,
        url: "https://images.unsplash.com/photo-1596728325488-5c4917fbd617?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        title: "Modern Pompadour",
        description: "Bold and stylish pompadour"
    },
    {
        id: 4,
        url: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        title: "Textured Crop",
        description: "Short and textured with fade"
    },
    {
        id: 5,
        url: "https://images.unsplash.com/photo-1599351431613-18ef1fdd09e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        title: "Clean Shave",
        description: "Traditional hot towel shave"
    },
    {
        id: 6,
        url: "https://images.unsplash.com/photo-1583499871880-de841d1ace2a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        title: "Brushed Back",
        description: "Medium length styled back"
    },
];

interface PortfolioImage {
    id: number;
    url: string;
    title: string;
    description: string;
}

const BarberPortfolio = () => {
    const { user, loading } = useRequireAuth({ allowedRoles: ["barber", "admin"] });
    const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>(initialImages);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [imageTitle, setImageTitle] = useState("");
    const [imageDescription, setImageDescription] = useState("");

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    const handleAddImage = () => {
        if (!imageUrl) {
            toast.error("Please enter an image URL");
            return;
        }

        const newImage = {
            id: Date.now(),
            url: imageUrl,
            title: imageTitle || "Untitled",
            description: imageDescription || "No description"
        };

        setPortfolioImages([...portfolioImages, newImage]);
        setImageUrl("");
        setImageTitle("");
        setImageDescription("");
        setIsAddModalOpen(false);
        toast.success("Image added to portfolio!");
    };

    const handleDeleteConfirm = () => {
        if (selectedImage) {
            setPortfolioImages(portfolioImages.filter(img => img.id !== selectedImage.id));
            setIsDeleteModalOpen(false);
            setSelectedImage(null);
            toast.success("Image removed from portfolio.");
        }
    };

    return (
        <DashboardLayout title="My Portfolio">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Image className="h-5 w-5 mr-2 text-barber" />
                            Portfolio Gallery
                        </div>
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-barber hover:bg-barber-muted"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add New Image
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {portfolioImages.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {portfolioImages.map((image) => (
                                <div
                                    key={image.id}
                                    className="group relative rounded-lg overflow-hidden shadow-md"
                                >
                                    <img
                                        src={image.url}
                                        alt={image.title}
                                        className="w-full h-64 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 text-white">
                                        <h3 className="font-semibold text-lg">{image.title}</h3>
                                        <p className="text-sm text-gray-200">{image.description}</p>
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => {
                                                setSelectedImage(image);
                                                setIsDeleteModalOpen(true);
                                            }}
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
                                <Image className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No images in your portfolio</h3>
                            <p className="text-gray-500 mb-4">
                                Add photos of your best work to showcase your skills.
                            </p>
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-barber hover:bg-barber-muted"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add First Image
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Image Dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Portfolio Image</DialogTitle>
                        <DialogDescription>
                            Add a new image to showcase your work. Enter the image URL below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <div className="flex items-center space-x-2">
                                <LinkIcon className="h-4 w-4 text-gray-500" />
                                <Input
                                    id="imageUrl"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Paste a direct link to your image file.
                            </p>
                        </div>

                        {imageUrl && (
                            <div className="border rounded-md p-2">
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className="w-full h-40 object-cover rounded"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                                    }}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="imageTitle">Title (optional)</Label>
                            <Input
                                id="imageTitle"
                                value={imageTitle}
                                onChange={(e) => setImageTitle(e.target.value)}
                                placeholder="e.g., Classic Fade"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageDescription">Description (optional)</Label>
                            <Input
                                id="imageDescription"
                                value={imageDescription}
                                onChange={(e) => setImageDescription(e.target.value)}
                                placeholder="e.g., Clean fade with textured top"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-barber hover:bg-barber-muted"
                            onClick={handleAddImage}
                            disabled={!imageUrl}
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            Add to Portfolio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Image</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this image from your portfolio? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedImage && (
                        <div className="border rounded-md p-2">
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.title}
                                className="w-full h-40 object-cover rounded"
                            />
                            <p className="mt-2 font-medium">{selectedImage.title}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove Image
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default BarberPortfolio;
