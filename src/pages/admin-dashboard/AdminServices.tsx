import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus, SortAsc, SortDesc } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    duration: number;
    created_at: string;
}

const serviceFormSchema = z.object({
    name: z.string().min(2, "Service name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.coerce.number().positive("Price must be positive"),
    duration: z.coerce.number().int("Duration must be a whole number").positive("Duration must be positive"),
});

const AdminServices = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [sortField, setSortField] = useState<string>("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const addForm = useForm<z.infer<typeof serviceFormSchema>>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            duration: 0,
        },
    });

    const editForm = useForm<z.infer<typeof serviceFormSchema>>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            duration: 0,
        },
    });

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/admin/services', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                if (!response.ok) throw new Error('Failed to fetch services');
                const data = await response.json();
                setServices(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching services:', error);
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    const handleSortChange = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedServices = [...services].sort((a, b) => {
        const valueA = a[sortField as keyof Service];
        const valueB = b[sortField as keyof Service];
        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    const handleAddService = async (data: z.infer<typeof serviceFormSchema>) => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to add service');
            const newService = await response.json();
            setServices([...services, newService]);
            setIsAddModalOpen(false);
            addForm.reset();
            toast.success('Service added successfully');
        } catch (error) {
            console.error('Error adding service:', error);
            toast.error('Failed to add service');
        }
    };

    const handleEditService = async (data: z.infer<typeof serviceFormSchema>) => {
        if (!selectedService) return;
        try {
            const response = await fetch(`http://localhost:3000/api/admin/services/${selectedService.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update service');
            const updatedService = await response.json();
            setServices(services.map(service => service.id === updatedService.id ? updatedService : service));
            setIsEditModalOpen(false);
            setSelectedService(null);
            toast.success('Service updated successfully');
        } catch (error) {
            console.error('Error updating service:', error);
            toast.error('Failed to update service');
        }
    };

    const handleDelete = async () => {
        if (!selectedService) return;
        try {
            const response = await fetch(`http://localhost:3000/api/admin/services/${selectedService.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!response.ok) throw new Error('Failed to delete service');
            setServices(services.filter(service => service.id !== selectedService.id));
            setIsDeleteModalOpen(false);
            setSelectedService(null);
            toast.success('Service deleted successfully');
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Failed to delete service');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Services Management</span>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-barber hover:bg-barber-muted"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add New Service
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer" onClick={() => handleSortChange("name")}>
                                    Name
                                    {sortField === "name" && (sortDirection === "asc" ? <SortAsc className="h-4 w-4 inline ml-1" /> : <SortDesc className="h-4 w-4 inline ml-1" />)}
                                </TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSortChange("price")}>
                                    Price
                                    {sortField === "price" && (sortDirection === "asc" ? <SortAsc className="h-4 w-4 inline ml-1" /> : <SortDesc className="h-4 w-4 inline ml-1" />)}
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSortChange("duration")}>
                                    Duration (min)
                                    {sortField === "duration" && (sortDirection === "asc" ? <SortAsc className="h-4 w-4 inline ml-1" /> : <SortDesc className="h-4 w-4 inline ml-1" />)}
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSortChange("created_at")}>
                                    Created At
                                    {sortField === "created_at" && (sortDirection === "asc" ? <SortAsc className="h-4 w-4 inline ml-1" /> : <SortDesc className="h-4 w-4 inline ml-1" />)}
                                </TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedServices.map((service) => (
                                <TableRow key={service.id}>
                                    <TableCell>{service.name}</TableCell>
                                    <TableCell>{service.description}</TableCell>
                                    <TableCell>${service.price}</TableCell>
                                    <TableCell>{service.duration}</TableCell>
                                    <TableCell>{new Date(service.created_at).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" className="mr-2" onClick={() => {
                                            setSelectedService(service);
                                            editForm.setValue("name", service.name);
                                            editForm.setValue("description", service.description);
                                            editForm.setValue("price", service.price);
                                            editForm.setValue("duration", service.duration);
                                            setIsEditModalOpen(true);
                                        }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => {
                                                setSelectedService(service);
                                                setIsDeleteModalOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="md:hidden space-y-4">
                    {sortedServices.map((service) => (
                        <div key={service.id} className="border rounded-md p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium">{service.name}</h3>
                                    <p className="text-sm text-gray-500">{service.description}</p>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs font-medium">${service.price}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-500">Duration:</p>
                                    <p>{service.duration} min</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Created:</p>
                                    <p>{new Date(service.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2 border-t">
                                <Button variant="outline" size="sm" onClick={() => {
                                    setSelectedService(service);
                                    editForm.setValue("name", service.name);
                                    editForm.setValue("description", service.description);
                                    editForm.setValue("price", service.price);
                                    editForm.setValue("duration", service.duration);
                                    setIsEditModalOpen(true);
                                }}>
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-500" onClick={() => {
                                    setSelectedService(service);
                                    setIsDeleteModalOpen(true);
                                }}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            {/* Add Service Dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Service</DialogTitle>
                        <DialogDescription>Fill in the details below to add a new service.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={addForm.handleSubmit(handleAddService)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Service Name</Label>
                            <Input id="name" {...addForm.register("name")} />
                            {addForm.formState.errors.name && (
                                <p className="text-sm text-red-500">{addForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...addForm.register("description")} />
                            {addForm.formState.errors.description && (
                                <p className="text-sm text-red-500">{addForm.formState.errors.description.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($)</Label>
                            <Input id="price" type="number" {...addForm.register("price")} />
                            {addForm.formState.errors.price && (
                                <p className="text-sm text-red-500">{addForm.formState.errors.price.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input id="duration" type="number" {...addForm.register("duration")} />
                            {addForm.formState.errors.duration && (
                                <p className="text-sm text-red-500">{addForm.formState.errors.duration.message}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Add Service</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Service Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Service</DialogTitle>
                        <DialogDescription>Modify the service details below.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editForm.handleSubmit(handleEditService)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Service Name</Label>
                            <Input id="name" {...editForm.register("name")} />
                            {editForm.formState.errors.name && (
                                <p className="text-sm text-red-500">{editForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...editForm.register("description")} />
                            {editForm.formState.errors.description && (
                                <p className="text-sm text-red-500">{editForm.formState.errors.description.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($)</Label>
                            <Input id="price" type="number" {...editForm.register("price")} />
                            {editForm.formState.errors.price && (
                                <p className="text-sm text-red-500">{editForm.formState.errors.price.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input id="duration" type="number" {...editForm.register("duration")} />
                            {editForm.formState.errors.duration && (
                                <p className="text-sm text-red-500">{editForm.formState.errors.duration.message}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Service</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this service? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    {selectedService && (
                        <div>
                            <p><strong>Name:</strong> {selectedService.name}</p>
                            <p><strong>Price:</strong> ${selectedService.price}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AdminServices;