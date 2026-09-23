import { Link } from "react-router-dom";
import { Bell, Calendar, CheckCheck, Scissors, Trash2, UserPlus, X } from "lucide-react";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { EmptyShelf } from "@/components/szlif/Loading";
import { JarLoader } from "@/components/szlif/Loading";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationText, type NotificationRow } from "@/lib/notification-text";
import { cn } from "@/lib/utils";

/**
 * The notification list, shared by the client, barber and admin panels.
 *
 * All three showed the same rows with the same four actions; they now differ
 * only in the heading their page gives them.
 */
const LOCALES = { pl, en: enUS } as const;

const ICONS: Record<string, typeof Bell> = {
    booking_pending: Calendar,
    appointment_confirmed: Calendar,
    appointment_completed: CheckCheck,
    appointment_canceled: X,
    appointment_no_show: X,
    new_booking_barber: Scissors,
    new_appointment_booked: Calendar,
    appointment_status_changed_by_barber: Calendar,
    new_user_registered: UserPlus,
};

const Row = ({
    row,
    onRead,
    onRemove,
}: {
    row: NotificationRow;
    onRead: (id: number) => void;
    onRemove: (id: number) => void;
}) => {
    const { t, lang } = useLanguage();
    const { title, body } = notificationText(row, t, lang);
    const Icon = ICONS[row.type] ?? Bell;

    const created = parseISO(row.created_at);
    const ago = isValid(created)
        ? formatDistanceToNow(created, { addSuffix: true, locale: LOCALES[lang] })
        : "";

    const content = (
        <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border border-border bg-secondary text-muted-foreground">
                <Icon className="h-4 w-4" />
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                    <span className="label-caps text-[0.8125rem]">{title}</span>
                    {!row.is_read && (
                        <span className="mt-1 h-2 w-2 shrink-0 bg-primary" aria-hidden />
                    )}
                </span>
                {body && (
                    <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                        {body}
                    </span>
                )}
                <span className="directions mt-2 block">{ago}</span>
            </span>
        </>
    );

    return (
        <li
            className={cn(
                "plate flex items-start gap-3 p-4 transition-colors",
                !row.is_read && "border-primary/60 bg-accent/70"
            )}
        >
            {row.link ? (
                <Link
                    to={row.link}
                    onClick={() => !row.is_read && onRead(row.id)}
                    className="flex min-w-0 flex-1 items-start gap-3"
                >
                    {content}
                </Link>
            ) : (
                <span className="flex min-w-0 flex-1 items-start gap-3">{content}</span>
            )}

            <span className="flex shrink-0 flex-col gap-1">
                {!row.is_read && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={t("notif.markRead")}
                        aria-label={t("notif.markRead")}
                        onClick={() => onRead(row.id)}
                    >
                        <CheckCheck className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title={t("notif.delete")}
                    aria-label={t("notif.delete")}
                    onClick={() => {
                        if (window.confirm(t("notif.deleteConfirm"))) onRemove(row.id);
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </span>
        </li>
    );
};

export const NotificationList = () => {
    const { t } = useLanguage();
    const { items, loading, error, unreadCount, markRead, markAllRead, remove } =
        useNotifications();

    if (loading) return <JarLoader />;
    if (error) return <EmptyShelf title={error} hint="" />;
    if (items.length === 0) {
        return <EmptyShelf title={t("notif.empty")} hint={t("notif.emptyHint")} />;
    }

    return (
        <div>
            <div className="rule-double mb-5 flex items-baseline justify-between gap-4 pb-2">
                <span className="directions">
                    {unreadCount} {t("notif.unread")}
                </span>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllRead}>
                        {t("notif.markAllRead")}
                    </Button>
                )}
            </div>

            <ul className="flex flex-col gap-3">
                {items.map(row => (
                    <Row key={row.id} row={row} onRead={markRead} onRemove={remove} />
                ))}
            </ul>
        </div>
    );
};
