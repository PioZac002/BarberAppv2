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
import { pl, enUS } from "date-fns/locale";
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
import { useLanguage } from "@/contexts/LanguageContext";

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: string; // spodziewamy się: 'client' | 'barber' | 'admin'
    created_at: string;
}

const userFormSchema = z.object({
    first_name: z.string().min(2, "Imię musi mieć co najmniej 2 znaki."),
    last_name: z.string().min(2, "Nazwisko musi mieć co najmniej 2 znaki."),
    email: z.string().email("Nieprawidłowy adres e-mail."),
    phone: z.string().optional(),
    // Ujednolicone role: 'client' zamiast 'user'
    role: z.enum(["client", "barber", "admin"]),
});

const AdminUsers = () => {
    const { t, lang } = useLanguage();
    const dateLocale = lang === 'pl' ? pl : enUS;
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const form = useForm<z.infer<typeof userFormSchema>>({
        resolver: zodResolver(userFormSchema),
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/admin/users`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (!response.ok) throw new Error("Failed to fetch users");
            const data: User[] = await response.json();

            // Normalizacja roli: jeśli z API przyjdzie 'user', traktujemy to jako 'client'
            const normalizedUsers = data.map((u) => ({
                ...u,
                role: u.role === "user" ? "client" : u.role,
            }));

            setUsers(normalizedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error(t('adminPanel.users.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter((user) => {
        if (roleFilter === "all") return true;
        return user.role === roleFilter;
    });

    const handleEditClick = (user: User) => {
        // Na wszelki wypadek normalizujemy też tutaj
        const normalizedRole =
            user.role === "user" ? "client" : (user.role as "client" | "barber" | "admin");

        setEditingUser(user);
        form.reset({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone || "",
            role: normalizedRole,
        });
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const onSubmit = async (data: z.infer<typeof userFormSchema>) => {
        if (!editingUser) return;
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/admin/users/${editingUser.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(data),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update user");
            }
            toast.success(t('adminPanel.users.updated'));
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(`${t('adminPanel.users.updateFailed')}: ${error.message}`);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/admin/users/${userToDelete.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (!response.ok) throw new Error("Failed to delete user");
            toast.success(t('adminPanel.users.deleted'));
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            toast.error(t('adminPanel.users.deleteFailed'));
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "admin":
                return "destructive";
            case "barber":
                return "outline";
            default:
                return "secondary";
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "admin":
                return t('adminPanel.users.roleAdmin');
            case "barber":
                return t('adminPanel.users.roleBarber');
            case "client":
            default:
                return t('adminPanel.users.roleClient');
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
                <CardTitle>{t('adminPanel.users.title')}</CardTitle>
                <CardDescription>
                    {t('adminPanel.users.subtitle')}
                </CardDescription>
                <div className="flex items-center gap-3 pt-4">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t('adminPanel.users.filterByRole')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('adminPanel.users.allRoles')}</SelectItem>
                            <SelectItem value="client">{t('adminPanel.users.clients')}</SelectItem>
                            <SelectItem value="barber">{t('adminPanel.users.barbersLabel')}</SelectItem>
                            <SelectItem value="admin">{t('adminPanel.users.admins')}</SelectItem>
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
                                <TableHead>{t('adminPanel.users.colName')}</TableHead>
                                <TableHead>{t('adminPanel.users.colEmail')}</TableHead>
                                <TableHead>{t('adminPanel.users.colPhone')}</TableHead>
                                <TableHead>{t('adminPanel.users.colRole')}</TableHead>
                                <TableHead>{t('adminPanel.users.colCreated')}</TableHead>
                                <TableHead className="text-right">{t('adminPanel.users.colActions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        {user.first_name} {user.last_name}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phone || t('adminPanel.users.noValue')}</TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {getRoleLabel(user.role)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.created_at
                                            ? format(
                                                parseISO(user.created_at),
                                                "d MMM yyyy",
                                                { locale: dateLocale }
                                            )
                                            : t('adminPanel.users.noValue')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditClick(user)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500"
                                            onClick={() => handleDeleteClick(user)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* WIDOK DLA URZĄDZEŃ MOBILNYCH */}
                <div className="md:hidden space-y-4">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="border rounded-lg p-4 space-y-3 shadow-sm"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-base">
                                    {user.first_name} {user.last_name}
                                </h3>
                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                    {getRoleLabel(user.role)}
                                </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>{user.email}</p>
                                <p>{t('adminPanel.users.phoneLabel')}{user.phone || t('adminPanel.users.noValue')}</p>
                            </div>
                            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                                <span>
                                    {t('adminPanel.users.createdLabel')}{" "}
                                    {user.created_at
                                        ? format(
                                            parseISO(user.created_at),
                                            "d MMM yyyy",
                                            { locale: dateLocale }
                                        )
                                        : t('adminPanel.users.noValue')}
                                </span>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditClick(user)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteClick(user)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            {/* Edit User Dialog */}
            <Dialog
                open={!!editingUser}
                onOpenChange={(open) => !open && setEditingUser(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('adminPanel.users.editUser')}</DialogTitle>
                        <DialogDesc>
                            {t('adminPanel.users.editUserDesc')}
                        </DialogDesc>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4 pt-4"
                        >
                            <FormField
                                control={form.control}
                                name="first_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('adminPanel.users.firstName')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="last_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('adminPanel.users.lastName')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('adminPanel.users.colEmail')}</FormLabel>
                                        <FormControl>
                                            <Input type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('adminPanel.users.colPhone')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('adminPanel.users.roleLabel')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="client">
                                                    {t('adminPanel.users.roleClient')}
                                                </SelectItem>
                                                <SelectItem value="barber">
                                                    {t('adminPanel.users.roleBarber')}
                                                </SelectItem>
                                                <SelectItem value="admin">
                                                    {t('adminPanel.users.roleAdmin')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingUser(null)}
                                >
                                    {t('adminPanel.users.cancel')}
                                </Button>
                                <Button type="submit">{t('adminPanel.users.saveChanges')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('adminPanel.users.deleteUser')}</DialogTitle>
                        <DialogDesc>
                            {t('adminPanel.users.deleteUserConfirm')}
                        </DialogDesc>
                    </DialogHeader>
                    {userToDelete && (
                        <div className="py-4">
                            <strong>{t('adminPanel.users.fullNameLabel')}</strong>{" "}
                            {userToDelete.first_name} {userToDelete.last_name}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            {t('adminPanel.users.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            {t('adminPanel.users.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AdminUsers;
