import { format, isValid, parseISO } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import type { Language, TranslationVars } from "@/contexts/LanguageContext";
import { catalogName } from "@/lib/catalog-names";

/**
 * Turns a stored notification into a sentence, in the reader's language.
 *
 * Rows carry the event type and its values, never prose, so the same row
 * reads correctly in Polish and in English — including the date, which is
 * formatted here rather than baked by the server in one locale.
 *
 * Rows migrated from the old tables have no params, only the sentence that
 * was written when they were created. Those keep their original text: it is
 * the only wording that exists for them, and inventing a new one would be
 * worse than showing the old.
 */
export type NotificationRow = {
    id: number;
    type: string;
    params?: Record<string, unknown> | null;
    link?: string | null;
    is_read: boolean;
    legacy_title?: string | null;
    legacy_message?: string | null;
    created_at: string;
};

type Translate = (path: string, vars?: TranslationVars) => string;

const LOCALES = { pl, en: enUS } as const;

export const formatWhen = (value: unknown, lang: Language): string => {
    if (typeof value !== "string") return "";
    const date = parseISO(value);
    if (!isValid(date)) return "";
    // the pattern is the same in both languages; the locale supplies the
    // month name and the ordering
    return format(date, "d MMMM yyyy, HH:mm", { locale: LOCALES[lang] });
};

export const notificationText = (
    row: NotificationRow,
    t: Translate,
    lang: Language
): { title: string; body: string } => {
    const key = `notif.${row.type}`;
    const title = t(`${key}.title`);
    const raw = (row.params ?? {}) as Record<string, unknown>;
    const hasParams = Object.keys(raw).length > 0;

    // An unknown type, or a row migrated before params existed, is shown
    // exactly as it was written. Translating only its title would leave a
    // heading in one language above a sentence in another.
    if (title === `${key}.title` || !hasParams) {
        return {
            title: row.legacy_title ?? title,
            body: row.legacy_message ?? "",
        };
    }

    const vars: TranslationVars = {};
    for (const [name, value] of Object.entries(raw)) {
        if (value === null || value === undefined) continue;
        vars[name] =
            name === "when"
                ? formatWhen(value, lang)
                : name === "status"
                  ? t(`notif.status.${String(value)}`)
                  : name === "service"
                    ? catalogName(String(value), lang)
                    : (value as string | number);
    }

    return { title, body: t(`${key}.body`, vars) };
};
