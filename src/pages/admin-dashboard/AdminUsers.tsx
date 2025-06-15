import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
import { Pencil, Trash2, Filter } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription as DialogDesc,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: string;
    created_at: string;
}

const userFormSchema = z.object({
    first_name: z.string().min(2, "First name must be at least 2 characters."),
    last_name: z.string().min(2, "Last name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
    phone: z.string().optional(),
    role: z.enum(["user", "barber", "admin"]),
});

const AdminUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const isMobile = useIsMobile();

    const form = useForm<z.infer<typeof userFormSchema>>({
        resolver: zodResolver(userFormSchema),
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/admin/users', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load user list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => roleFilter === "all" || user.role === roleFilter);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        form.reset({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone || "",
            role: user.role as "user" | "barber" | "admin",
        });
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const onSubmit = async (data: z.infer<typeof userFormSchema>) => {
        if (!editingUser) return;
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user');
            }
            toast.success('User updated successfully');
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(`Update failed: ${error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        try {
            const response = await fetch(`http://localhost:3000/api/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            if (!response.ok) throw new Error('Failed to delete user');
            toast.success('User deleted successfully');
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-barber"></div></div>;
    }

    const getRoleBadgeVariant = (role: string) => {
        switch(role) {
            case 'admin': return 'destructive';
            case 'barber': return 'outline';
            default: return 'secondary';
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>View, edit, and manage all users in the system.</CardDescription>
                <div className="flex items-center gap-3 pt-4">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="user">Clients</SelectItem>
                            <SelectItem value="barber">Barbers</SelectItem>
                            <SelectItem value="admin">Admins</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {/* WIDOK DLA KOMPUTERÓW */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.first_name} {user.last_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phone || 'N/A'}</TableCell>
                                    <TableCell><Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge></TableCell>
                                    <TableCell>{user.created_at ? format(parseISO(user.created_at), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteClick(user)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* WIDOK DLA URZĄDZEŃ MOBILNYCH */}
                <div className="md:hidden space-y-4">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="border rounded-lg p-4 space-y-3 shadow-sm">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-base">{user.first_name} {user.last_name}</h3>
                                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>{user.email}</p>
                                <p>Phone: {user.phone || 'N/A'}</p>
                            </div>
                            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                                <span>Created: {user.created_at ? format(parseISO(user.created_at), 'MMM dd, yyyy') : 'N/A'}</span>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="outline" onClick={() => handleEditClick(user)}><Pencil className="h-4 w-4" /></Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(user)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </CardContent>

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDesc>Update user details and role.</DialogDesc>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField control={form.control} name="first_name" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="last_name" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="user">Client</SelectItem>
                                            <SelectItem value="barber">Barber</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete User</DialogTitle><DialogDesc>Are you sure? This action cannot be undone.</DialogDesc></DialogHeader>
                    {userToDelete && <div className="py-4"><strong>Name:</strong> {userToDelete.first_name} {userToDelete.last_name}</div>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AdminUsers;
