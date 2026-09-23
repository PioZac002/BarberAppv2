import { Link } from "react-router-dom";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationText } from "@/lib/notification-text";
import { cn } from "@/lib/utils";

/**
 * The short list of recent notifications shown on a panel's overview.
 *
 * The three overviews each fetched and rendered this themselves, which is how
 * they all broke at once when the payload changed shape. One component now
 * reads the same hook the full list does.
 */
const LOCALES = { pl, en: enUS } as const;

export const NotificationDigest = ({
    limit = 5,
    allHref,
    className,
}: {
    limit?: number;
    allHref: string;
    className?: string;
}) => {
    const { t, lang } = useLanguage();
    const { items, loading } = useNotifications(limit);

    if (loading) {
        return (
            <ul className={cn("flex flex-col gap-2.5", className)}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="h-14 animate-pulse rounded-[1px] border border-foreground/10 bg-secondary" />
                ))}
            </ul>
        );
    }

    if (items.length === 0) {
        return (
            <p className={cn("py-4 text-center text-sm text-muted-foreground", className)}>
                {t("notif.empty")}
            </p>
        );
    }

    return (
        <div className={className}>
            <ul className="flex flex-col gap-2.5">
                {items.map(row => {
                    const { title } = notificationText(row, t, lang);
                    const created = parseISO(row.created_at);
                    return (
                        <li
                            key={row.id}
                            className={cn(
                                "rounded-[2px] border p-2.5",
                                row.is_read
                                    ? "border-border bg-secondary/50"
                                    : "border-primary/60 bg-accent/70"
                            )}
                        >
                            <Link to={row.link || allHref} className="group block">
                                <span
                                    className={cn(
                                        "block truncate text-sm font-medium group-hover:text-primary",
                                        row.is_read ? "text-muted-foreground" : "text-foreground"
                                    )}
                                >
                                    {title}
                                </span>
                                <span className="directions mt-1 block">
                                    {isValid(created)
                                        ? formatDistanceToNow(created, { addSuffix: true, locale: LOCALES[lang] })
                                        : "—"}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
            <Link
                to={allHref}
                className="label-caps mt-4 inline-block text-[0.6875rem] text-primary underline-offset-4 hover:underline"
            >
                {t("notif.seeAll")}
            </Link>
        </div>
    );
};
