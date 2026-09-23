import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import type { NotificationRow } from "@/lib/notification-text";

/**
 * One notification client for all three panels.
 *
 * The endpoint differs only by the role prefix the router already enforces;
 * everything past that is identical, so the three panels share this instead
 * of keeping three copies of the same fetch, error handling and state.
 */
const BASE_BY_ROLE: Record<string, string> = {
    client: "/api/user",
    barber: "/api/barber",
    admin: "/api/admin",
};

export function useNotifications(limit?: number) {
    const { token, user } = useAuth();
    const { t } = useLanguage();
    const [items, setItems] = useState<NotificationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const base = BASE_BY_ROLE[user?.role ?? "client"] ?? "/api/user";
    const root = `${import.meta.env.VITE_API_URL}${base}/notifications`;

    const authHeaders = useMemo(
        () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
        [token]
    );

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const url = limit ? `${root}?limit=${limit}` : root;
            const res = await fetch(url, { headers: authHeaders });
            if (!res.ok) throw new Error(String(res.status));
            setItems(await res.json());
            setError(null);
        } catch {
            setError(t("notif.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [root, limit, token, authHeaders, t]);

    useEffect(() => { void load(); }, [load]);

    /* Each mutation updates local state first and rolls back on failure, so a
       list of twenty does not refetch twenty times to tick one checkbox. */
    const markRead = useCallback(async (id: number) => {
        const before = items;
        setItems(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
        try {
            const res = await fetch(`${root}/${id}/read`, { method: "PUT", headers: authHeaders });
            if (!res.ok) throw new Error();
        } catch {
            setItems(before);
            toast.error(t("notif.markFailed"));
        }
    }, [items, root, authHeaders, t]);

    const markAllRead = useCallback(async () => {
        const before = items;
        setItems(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            const res = await fetch(`${root}/read-all`, { method: "PUT", headers: authHeaders });
            if (!res.ok) throw new Error();
            toast.success(t("notif.allRead"));
        } catch {
            setItems(before);
            toast.error(t("notif.markAllFailed"));
        }
    }, [items, root, authHeaders, t]);

    const remove = useCallback(async (id: number) => {
        const before = items;
        setItems(prev => prev.filter(n => n.id !== id));
        try {
            const res = await fetch(`${root}/${id}`, { method: "DELETE", headers: authHeaders });
            if (!res.ok) throw new Error();
            toast.success(t("notif.deleted"));
        } catch {
            setItems(before);
            toast.error(t("notif.deleteFailed"));
        }
    }, [items, root, authHeaders, t]);

    const unreadCount = useMemo(() => items.filter(n => !n.is_read).length, [items]);

    return { items, loading, error, unreadCount, reload: load, markRead, markAllRead, remove };
}
